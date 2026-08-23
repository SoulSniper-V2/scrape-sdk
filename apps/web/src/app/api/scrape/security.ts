import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2_000_000;

export async function assertPublicHttpUrl(value: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("URL must be an absolute http(s) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must be an absolute http(s) URL");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Private network URLs are not allowed");
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname }]
      : await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("URL could not be resolved");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network URLs are not allowed");
  }
  return parsed;
}

export function createSafeFetch(fetchFn: typeof fetch = globalThis.fetch.bind(globalThis)): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let current = new URL(input instanceof Request ? input.url : String(input));
    const requestInit: RequestInit = {
      ...(input instanceof Request
        ? { method: input.method, headers: input.headers, body: input.body, signal: input.signal }
        : {}),
      ...init,
      redirect: "manual",
    };

    for (let redirect = 0; ; redirect++) {
      if (requestInit.signal?.aborted) throw requestInit.signal.reason ?? abortError();
      await assertPublicHttpUrl(current.href);
      const response = await fetchFn(current.href, requestInit);
      if (response.status < 300 || response.status >= 400) return capResponse(response);

      const location = response.headers.get("location");
      if (!location || redirect >= MAX_REDIRECTS) return capResponse(response);
      await response.body?.cancel();
      const next = new URL(location, current);
      if (next.origin !== current.origin && requestInit.headers) {
        const headers = new Headers(requestInit.headers);
        headers.delete("authorization");
        headers.delete("cookie");
        requestInit.headers = headers;
      }
      current = next;
    }
  }) as typeof fetch;
}

export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  const mappedHex = mappedIpv4(normalized);
  if (mappedHex) return isPrivateAddress(mappedHex);

  if (isIP(normalized) === 4) {
    const octets = normalized.split(".").map(Number);
    const [a, b] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 2 || b === 168)) ||
      (a === 198 && b >= 18 && b <= 19) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("2001:db8") ||
    /^fe[89ab]/.test(normalized)
  );
}

function mappedIpv4(address: string): string | undefined {
  const parts = address.split("::");
  if (parts.length > 2) return undefined;
  const [left, right] = parts;
  const leftGroups = left ? left.split(":") : [];
  const rightGroups = right ? right.split(":") : [];
  const missing = 8 - leftGroups.length - rightGroups.length;
  if (missing < 0) return undefined;
  const groups = [...leftGroups, ...Array.from({ length: missing }, () => "0"), ...rightGroups];
  if (groups.length !== 8 || groups.slice(0, 5).some((group) => group !== "0") || groups[5] !== "ffff") {
    return undefined;
  }
  const high = Number.parseInt(groups[6], 16);
  const low = Number.parseInt(groups[7], 16);
  if (!Number.isInteger(high) || !Number.isInteger(low)) return undefined;
  return [high >>> 8, high & 255, low >>> 8, low & 255].join(".");
}

async function capResponse(response: Response): Promise<Response> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Response exceeds the ${MAX_RESPONSE_BYTES}-byte limit`);
  }
  if (!response.body) return response;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error(`Response exceeds the ${MAX_RESPONSE_BYTES}-byte limit`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const headers = new Headers(response.headers);
  headers.set("content-length", String(bytes.byteLength));
  return new Response(bytes, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}
