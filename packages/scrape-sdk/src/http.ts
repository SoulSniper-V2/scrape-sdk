import { AuthError, ProviderResponseError, RateLimitError, ScrapeError } from "./errors.js";

export type FetchLike = typeof fetch;

export async function request(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit,
  provider: string
): Promise<Response> {
  const response = await fetchFn(url, init);
  if (response.status === 429 || response.status === 432 || response.status === 433) {
    throw new RateLimitError(provider);
  }
  if (response.status === 401 || response.status === 403) {
    const body = await safeText(response);
    throw new AuthError(provider, body || `HTTP ${response.status}`);
  }
  if (response.status === 408 || response.status === 504) {
    throw new ScrapeError(`HTTP ${response.status}`, provider, response.status, true);
  }
  if (response.status >= 500) {
    const body = await safeText(response);
    throw new ScrapeError(body || `HTTP ${response.status}`, provider, response.status, true);
  }
  if (!response.ok) {
    const body = await safeText(response);
    throw new ScrapeError(body || `HTTP ${response.status}`, provider, response.status, false);
  }
  return response;
}

export async function requestJson<T = unknown>(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit,
  provider: string
): Promise<T> {
  const response = await request(fetchFn, url, init, provider);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ProviderResponseError(provider, "Provider returned invalid JSON");
  }
}

export async function requestText(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit,
  provider: string
): Promise<string> {
  const response = await request(fetchFn, url, init, provider);
  return response.text();
}

export function jsonInit(body: unknown, headers?: Record<string, string>): RequestInit {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a) return b;
  if (!b) return a;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([a, b]);
  }
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(a.aborted ? a.reason : b.reason);
    a.removeEventListener("abort", onAbort);
    b.removeEventListener("abort", onAbort);
  };
  if (a.aborted || b.aborted) {
    controller.abort(a.aborted ? a.reason : b.reason);
    return controller.signal;
  }
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("Aborted"));
    };
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(signal.reason ?? new Error("Aborted"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}
