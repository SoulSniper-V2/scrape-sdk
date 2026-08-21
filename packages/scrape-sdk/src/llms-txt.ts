import { ScrapeResult } from "./types.js";
import { llmsTxtCandidates } from "./url.js";
import { firstHeading } from "./heading.js";
import { mergeSignals } from "./http.js";

const PROBE_MS = 1_500;

export async function tryLlmsTxt(
  url: string,
  fetchFn: typeof fetch,
  signal?: AbortSignal
): Promise<ScrapeResult | undefined> {
  const candidates = llmsTxtCandidates(url);
  if (candidates.length === 0) return undefined;

  const startTime = Date.now();
  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_MS);
    const merged = mergeSignals(signal, controller.signal);
    try {
      const response = await fetchFn(candidate, {
        headers: {
          Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
          "User-Agent": "Mozilla/5.0 (compatible; ScrapeSDK/0.2; +https://github.com/SoulSniper-V2/scrape-sdk)",
        },
        signal: merged,
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("html")) continue;
      const body = await response.text();
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
      if (signal?.aborted) throw err;
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return undefined;
}

export function looksLikeLlmsTxt(body: string): boolean {
  const trimmed = body.trim();
  if (trimmed.length < 40 || trimmed.length > 2_000_000) return false;
  const lower = trimmed.slice(0, 200).toLowerCase();
  if (lower.startsWith("<!doctype") || lower.startsWith("<html")) return false;
  return trimmed.startsWith("#") || trimmed.includes("](http") || /\bllms\.txt\b/i.test(trimmed);
}
