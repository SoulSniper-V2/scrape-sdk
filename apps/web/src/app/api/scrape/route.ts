import { NextResponse } from "next/server";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";
import { assertPublicHttpUrl, createSafeFetch, PublicUrlError, ResponseLimitError } from "./security";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_TRACKED_ADDRESSES = 10_000;
const requests = new Map<string, { startedAt: number; count: number }>();

export async function POST(req: Request) {
  const clientAddress = requestAddress(req);
  if (!consumeRateLimit(clientAddress)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { url?: unknown; provider?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (body.provider !== undefined && body.provider !== "jina" && body.provider !== "local") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  try {
    await assertPublicHttpUrl(body.url);
    const fetchFn = createSafeFetch();
    const provider = body.provider === "local" ? local({ fetch: fetchFn }) : jina({ fetch: fetchFn });
    const fallback = body.provider === "local" ? jina({ fetch: fetchFn }) : local({ fetch: fetchFn });
    const client = createScrapeClient({
      provider,
      fallback,
      timeoutMs: 20_000,
      retries: 0,
      fetch: fetchFn,
      cache: false,
    });

    const result = await client.scrape(body.url, {
      format: "markdown",
      onlyMainContent: true,
      maxChars: 20_000,
      signal: req.signal,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    const status = err instanceof PublicUrlError ? 400 : err instanceof ResponseLimitError ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function requestAddress(req: Request): string {
  // Vercel overwrites X-Forwarded-For. If another proxy/CDN fronts this route, revisit this key.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function consumeRateLimit(address: string): boolean {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now - entry.startedAt >= WINDOW_MS) requests.delete(key);
  }
  const current = requests.get(address);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (!current && requests.size >= MAX_TRACKED_ADDRESSES) {
      const oldest = requests.keys().next().value;
      if (oldest) requests.delete(oldest);
    }
    requests.set(address, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}
