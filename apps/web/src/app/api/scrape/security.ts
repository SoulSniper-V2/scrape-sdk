import { lookup } from "node:dns/promises";
import * as http from "node:http";
import * as https from "node:https";
import { isIP } from "node:net";

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 2_000_000;

export class PublicUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUrlError";
  }
}

export class ResponseLimitError extends Error {
  constructor() {
    super(`Response exceeds the ${MAX_RESPONSE_BYTES}-byte limit`);
    this.name = "ResponseLimitError";
  }
}

export async function assertPublicHttpUrl(value: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new PublicUrlError("URL must be an absolute http(s) URL");
  }
  return (await resolvePublicHttpUrl(parsed)).url;
}

interface ResolvedPublicUrl {
  url: URL;
  address: string;
  family: 4 | 6;
}

async function resolvePublicHttpUrl(parsed: URL): Promise<ResolvedPublicUrl> {
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PublicUrlError("URL must be an absolute http(s) URL");
  }
  if (parsed.username || parsed.password) {
    throw new PublicUrlError("URLs with embedded credentials are not allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new PublicUrlError("Private network URLs are not allowed");
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname }]
      : await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new PublicUrlError("URL could not be resolved");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new PublicUrlError("Private network URLs are not allowed");
  }

  const address = addresses[0]?.address;
  const family = address ? isIP(address) : 0;
  if (!address || (family !== 4 && family !== 6)) {
    throw new PublicUrlError("URL could not be resolved");
  }
  return { url: parsed, address, family };
}

/**
 * The default transport pins each connection to the address checked above.
 * Injected transports are intended for tests or callers that provide their own
 * connection-level DNS policy.
 */
export function createSafeFetch(fetchFn?: typeof fetch): typeof fetch {
  const usePinnedTransport = fetchFn === undefined;
  const transport = fetchFn ?? globalThis.fetch.bind(globalThis);
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
      const resolved = await resolvePublicHttpUrl(current);
      const response = usePinnedTransport
        ? await fetchPinned(resolved, requestInit)
        : await transport(current.href, requestInit);
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

async function fetchPinned(resolved: ResolvedPublicUrl, init: RequestInit): Promise<Response> {
  if (init.signal?.aborted) throw init.signal.reason ?? abortError();
  const headers = new Headers(init.headers);
  if (!headers.has("accept-encoding")) headers.set("accept-encoding", "identity");
  const body = await requestBody(init.body);
  const request = resolved.url.protocol === "https:" ? https.request : http.request;
  const headerRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerRecord[key] = value;
  });

  return new Promise<Response>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const nodeRequest = request(
      {
        protocol: resolved.url.protocol,
        hostname: resolved.url.hostname,
        port: resolved.url.port || undefined,
        path: `${resolved.url.pathname}${resolved.url.search}`,
        method: init.method || "GET",
        headers: headerRecord,
        lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
        signal: init.signal ?? undefined,
      },
      (nodeResponse) => {
        const declaredLength = Number(nodeResponse.headers["content-length"]);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
          nodeResponse.resume();
          fail(new ResponseLimitError());
          return;
        }

        const chunks: Uint8Array[] = [];
        let total = 0;
        nodeResponse.on("data", (chunk: Uint8Array) => {
          total += chunk.byteLength;
          if (total > MAX_RESPONSE_BYTES) {
            nodeResponse.destroy();
            fail(new ResponseLimitError());
            return;
          }
          chunks.push(chunk);
        });
        nodeResponse.on("end", () => {
          if (settled) return;
          const bytes = new Uint8Array(total);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(nodeResponse.headers)) {
            if (value === undefined) continue;
            for (const entry of Array.isArray(value) ? value : [value]) {
              responseHeaders.append(key, entry);
            }
          }
          responseHeaders.set("content-length", String(bytes.byteLength));
          settled = true;
          resolve(
            new Response(bytes, {
              status: nodeResponse.statusCode ?? 500,
              statusText: nodeResponse.statusMessage ?? "",
              headers: responseHeaders,
            })
          );
        });
        nodeResponse.on("error", fail);
      }
    );
    nodeRequest.on("error", fail);
    if (body !== undefined) nodeRequest.write(body);
    nodeRequest.end();
  });
}

async function requestBody(body: BodyInit | null | undefined): Promise<string | Uint8Array | undefined> {
  if (body === null || body === undefined) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
  throw new Error("Safe fetch does not support streaming request bodies");
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
    throw new ResponseLimitError();
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
        throw new ResponseLimitError();
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
