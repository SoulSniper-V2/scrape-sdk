import { ScrapeClient } from "./client.js";
import { ScrapeClientConfig, ScrapeProvider } from "./types.js";
import { firecrawl } from "./adapters/firecrawl.js";
import { jina } from "./adapters/jina.js";
import { tavily } from "./adapters/tavily.js";
import { spider } from "./adapters/spider.js";
import { browserbase } from "./adapters/browserbase.js";
import { local } from "./adapters/local.js";

export interface FromEnvOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
  strategy?: ScrapeClientConfig["strategy"];
  cache?: ScrapeClientConfig["cache"];
}

/**
 * Build a client from environment keys.
 * Always includes Jina (optional key) and local Cheerio as the last fallback.
 */
export function fromEnv(options: FromEnvOptions = {}): ScrapeClient {
  const fetchFn = options.fetch;
  const providers: ScrapeProvider[] = [];

  const firecrawlKey = process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const spiderKey = process.env.SPIDER_API_KEY || process.env.SPIDER_KEY;
  const browserbaseKey = process.env.BROWSERBASE_API_KEY;
  const jinaKey = process.env.JINA_API_KEY || process.env.JINA_KEY;

  if (firecrawlKey) providers.push(firecrawl({ apiKey: firecrawlKey, fetch: fetchFn }));
  if (tavilyKey) providers.push(tavily({ apiKey: tavilyKey, fetch: fetchFn }));
  if (spiderKey) providers.push(spider({ apiKey: spiderKey, fetch: fetchFn }));
  if (browserbaseKey) providers.push(browserbase({ apiKey: browserbaseKey, fetch: fetchFn }));
  providers.push(jina({ apiKey: jinaKey, fetch: fetchFn }));
  providers.push(local({ fetch: fetchFn }));

  return new ScrapeClient({
    providers,
    timeoutMs: options.timeoutMs,
    strategy: options.strategy ?? "priority",
    cache: options.cache ?? { ttlMs: 60_000 },
    fetch: fetchFn,
  });
}
