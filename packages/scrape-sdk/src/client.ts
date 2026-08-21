import {
  BatchScrapeOptions,
  CrawlOptions,
  CrawlResult,
  ExtractOptions,
  ExtractResult,
  FailoverHop,
  MapOptions,
  MapResult,
  MemoryCacheConfig,
  ProviderCapability,
  RoutingStrategy,
  ScrapeClientConfig,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
  SearchOptions,
  SearchResult,
} from "./types.js";
import {
  AllProvidersFailedError,
  CapabilityError,
  TimeoutError,
  failoverReason,
  isRetryableError,
} from "./errors.js";
import { MemoryCache, cacheKey } from "./cache.js";
import { sleep } from "./http.js";
import { assertHttpUrl } from "./url.js";
import { clipText } from "./clip.js";
import { tryLlmsTxt } from "./llms-txt.js";

export class ScrapeClient {
  private readonly providers: ScrapeProvider[];
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly strategy: RoutingStrategy;
  private readonly cache?: MemoryCache;
  private readonly onFailover?: ScrapeClientConfig["onFailover"];
  private readonly fetchFn: typeof fetch;

  constructor(config: ScrapeClientConfig) {
    this.providers = resolveProviders(config);
    if (this.providers.length === 0) {
      throw new Error("createScrapeClient requires at least one provider");
    }
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.retries = config.retries ?? 1;
    this.strategy = config.strategy ?? "priority";
    this.onFailover = config.onFailover;
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
    if (config.cache) {
      const cacheConfig: MemoryCacheConfig = config.cache === true ? {} : config.cache;
      this.cache = new MemoryCache(cacheConfig);
    }
  }

  listProviders(): string[] {
    return this.providers.map((p) => p.name);
  }

  supports(capability: ProviderCapability): boolean {
    return this.providers.some((p) => p.capabilities.includes(capability));
  }

  async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
    assertHttpUrl(url);
    const key = cacheKey(url, {
      op: "scrape",
      format: options?.format,
      main: options?.onlyMainContent,
      max: options?.maxChars,
      llms: options?.preferLlmsTxt !== false,
    });
    const hit = this.cache?.get(key);
    if (hit) return hit;

    if (
      options?.preferLlmsTxt !== false &&
      options?.format !== "html" &&
      options?.format !== "json" &&
      !options?.schema
    ) {
      const llms = await tryLlmsTxt(url, this.fetchFn, options?.signal);
      if (llms) {
        const clipped = applyClip(llms, options?.maxChars);
        this.cache?.set(key, clipped);
        return clipped;
      }
    }

    const needed: ProviderCapability[] = options?.schema ? ["extract"] : ["scrape"];
    if (options?.waitForMs) needed.push("js");

    const result = await this.run(needed, (provider, signal) =>
      provider.scrape(url, { ...options, signal })
    );
    const clipped = applyClip(result, options?.maxChars);
    this.cache?.set(key, clipped);
    return clipped;
  }

  async scrapeMany(urls: string[], options?: BatchScrapeOptions): Promise<ScrapeResult[]> {
    const concurrency = Math.max(1, options?.concurrency ?? 4);
    const results: ScrapeResult[] = new Array(urls.length);
    let index = 0;

    const worker = async () => {
      while (index < urls.length) {
        const current = index++;
        results[current] = await this.scrape(urls[current], options);
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
    return results;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const trimmed = query.trim();
    if (!trimmed) throw new Error("search query must not be empty");
    return this.run(["search"], (provider, signal) => {
      if (!provider.search) throw new CapabilityError("search", provider.name);
      return provider.search(trimmed, { ...options, signal });
    });
  }

  async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
    assertHttpUrl(url);
    const result = await this.run(["crawl"], (provider, signal) => {
      if (!provider.crawl) throw new CapabilityError("crawl", provider.name);
      return provider.crawl(url, { ...options, signal });
    }, this.timeoutMs * 4);
    if (!options?.maxChars) return result;
    return {
      ...result,
      pages: result.pages.map((page) => applyClip(page, options.maxChars)),
    };
  }

  async map(url: string, options?: MapOptions): Promise<MapResult> {
    assertHttpUrl(url);
    return this.run(["map"], (provider, signal) => {
      if (!provider.map) throw new CapabilityError("map", provider.name);
      return provider.map(url, { ...options, signal });
    });
  }

  async extract(url: string, options: ExtractOptions): Promise<ExtractResult> {
    assertHttpUrl(url);
    if (!options?.schema) throw new Error("extract requires a JSON schema");
    return this.run(["extract"], async (provider, signal) => {
      if (provider.extract) {
        return provider.extract(url, { ...options, signal });
      }
      const scraped = await provider.scrape(url, {
        format: "json",
        schema: options.schema,
        prompt: options.prompt,
        signal,
      });
      if (scraped.json === undefined) {
        throw new CapabilityError("extract", provider.name);
      }
      return {
        url: scraped.url,
        data: scraped.json,
        provider: scraped.provider,
        latencyMs: scraped.latencyMs,
      };
    });
  }

  private candidates(needed: ProviderCapability[]): ScrapeProvider[] {
    const matching = this.providers.filter((p) => needed.every((cap) => p.capabilities.includes(cap)));
    if (this.strategy === "cost") {
      return [...matching].sort((a, b) => a.cost - b.cost);
    }
    return matching;
  }

  private async run<T>(
    needed: ProviderCapability[],
    fn: (provider: ScrapeProvider, signal: AbortSignal) => Promise<T>,
    timeoutMs = this.timeoutMs
  ): Promise<T> {
    const chain = this.candidates(needed);
    if (chain.length === 0) {
      throw new CapabilityError(needed.join("+"));
    }

    const errors: Error[] = [];
    const hops: FailoverHop[] = [];

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      for (let attempt = 0; attempt <= this.retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const value = await fn(provider, controller.signal);
          return attachFailover(value, hops);
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          if (controller.signal.aborted && !isUserAbort(error)) {
            errors.push(new TimeoutError(provider.name, timeoutMs));
          } else {
            errors.push(error);
          }
          const retryable = isRetryableError(errors[errors.length - 1]);
          const hasAttemptsLeft = attempt < this.retries && retryable;
          if (hasAttemptsLeft) {
            await sleep(250 * (attempt + 1));
            continue;
          }
          const failed = errors[errors.length - 1];
          hops.push({ provider: provider.name, reason: failoverReason(failed) });
          const next = chain[i + 1];
          if (next && this.onFailover) {
            this.onFailover(failed, provider.name, next.name);
          }
          break;
        } finally {
          clearTimeout(timer);
        }
      }
    }

    throw new AllProvidersFailedError(errors);
  }
}

function resolveProviders(config: ScrapeClientConfig): ScrapeProvider[] {
  if (config.providers?.length) return config.providers;
  const fallbacks = Array.isArray(config.fallback)
    ? config.fallback
    : config.fallback
      ? [config.fallback]
      : [];
  return [config.provider, ...fallbacks].filter((p): p is ScrapeProvider => Boolean(p));
}

function isUserAbort(error: Error): boolean {
  return error.name === "AbortError" && !error.message.includes("timeout");
}

function attachFailover<T>(result: T, hops: FailoverHop[]): T {
  if (!hops.length || result === null || typeof result !== "object") return result;
  return { ...(result as object), failedOverFrom: hops } as T;
}

function applyClip(result: ScrapeResult, maxChars?: number): ScrapeResult {
  const markdown = clipText(result.markdown, maxChars);
  const text = result.text !== undefined ? clipText(result.text, maxChars) : undefined;
  const truncated = markdown.truncated || Boolean(text?.truncated);
  return {
    ...result,
    markdown: markdown.text,
    text: text?.text,
    truncated,
    charCount: result.markdown.length,
  };
}
