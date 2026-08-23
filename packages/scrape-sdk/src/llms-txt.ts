import { ScrapeResult } from "./types.js";
import { llmsTxtCandidates } from "./url.js";
import { firstHeading } from "./heading.js";
import { cleanupMergedSignal, mergeSignals } from "./http.js";

const PROBE_MS = 1_500;

export async function tryLlmsTxt(
  url: string,
  fetchFn: typeof fetch,
  options: LlmsTxtOptions = {}
): Promise<ScrapeResult | undefined> {
  const candidates = llmsTxtCandidates(url);
  if (candidates.length === 0) return undefined;

  const startTime = Date.now();
  const deadline = startTime + (options.timeoutMs ?? PROBE_MS);
  for (const candidate of candidates) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const controller = new AbortController();
    const probeMs = Math.min(PROBE_MS, remaining);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let callerAbortHandler: (() => void) | undefined;
    const merged = mergeSignals(options.signal, controller.signal);
    const operation = Promise.resolve().then(() =>
      fetchFn(candidate, {
        headers: {
          Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
          "User-Agent": "Mozilla/5.0 (compatible; ScrapeSDK/0.2; +https://github.com/SoulSniper-V2/scrape-sdk)",
          ...options.headers,
        },
        signal: merged,
      })
    );
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error(`llms.txt probe timed out after ${probeMs}ms`));
      }, probeMs);
    });
    const callerAbort = options.signal
      ? new Promise<never>((_, reject) => {
          callerAbortHandler = () => reject(abortReason(options.signal!));
          if (options.signal!.aborted) callerAbortHandler();
          else options.signal!.addEventListener("abort", callerAbortHandler, { once: true });
      })
      : undefined;
    let bodyOperation: Promise<string> | undefined;
    try {
      const response = await Promise.race(
        callerAbort ? [operation, timeout, callerAbort] : [operation, timeout]
      );
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("html")) continue;
      bodyOperation = Promise.resolve().then(() => response.text());
      const body = await Promise.race(
        callerAbort ? [bodyOperation, timeout, callerAbort] : [bodyOperation, timeout]
      );
      if (!looksLikeLlmsTxt(body)) continue;
      return {
        url: candidate,
        title: firstHeading(body) || "llms.txt",
        markdown: body,
        metadata: { statusCode: 200, canonicalUrl: candidate },
        provider: "llms.txt",
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (options.signal?.aborted) throw err;
      continue;
    } finally {
      if (timer) clearTimeout(timer);
      if (options.signal && callerAbortHandler) {
        options.signal.removeEventListener("abort", callerAbortHandler);
      }
      cleanupMergedSignal(merged);
      void operation.catch(() => undefined);
      void bodyOperation?.catch(() => undefined);
    }
  }
  return undefined;
}

export interface LlmsTxtOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export function looksLikeLlmsTxt(body: string): boolean {
  const trimmed = body.trim();
  if (trimmed.length < 40 || trimmed.length > 2_000_000) return false;
  const lower = trimmed.slice(0, 200).toLowerCase();
  if (lower.startsWith("<!doctype") || lower.startsWith("<html")) return false;
  return trimmed.startsWith("#") || trimmed.includes("](http") || /\bllms\.txt\b/i.test(trimmed);
}

function abortReason(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  const error = new Error(signal.reason === undefined ? "The operation was aborted" : String(signal.reason));
  error.name = "AbortError";
  return error;
}
