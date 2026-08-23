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
  UnsupportedOptionError,
  failoverReason,
  isRetryableError,
} from "./errors.js";
import { MemoryCache, cacheKey } from "./cache.js";
import { cleanupMergedSignal, mergeSignals, sleep } from "./http.js";
import { assertHttpUrl } from "./url.js";
import { clipText } from "./clip.js";
import { tryLlmsTxt } from "./llms-txt.js";
import { markdownToText } from "./markdown.js";

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
    this.providers.forEach(validateProvider);
    this.timeoutMs = positiveFinite(config.timeoutMs ?? 30_000, "timeoutMs");
    this.retries = nonNegativeInteger(config.retries ?? 1, "retries");
    this.strategy = config.strategy ?? "priority";
    if (this.strategy !== "priority" && this.strategy !== "cost") {
      throw new RangeError(`strategy must be priority or cost`);
    }
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
    if (options?.format === "json" && !options.schema) {
      throw new Error("format:json requires a schema");
    }
    const startedAt = Date.now();
    const deadlineAt = startedAt + this.timeoutMs;
    const cacheEnabled = Boolean(this.cache && !options?.headers);
    const key = cacheKey(url, {
      op: "scrape",
      format: options?.format,
      main: options?.onlyMainContent,
      wait: options?.waitForMs,
      links: options?.includeLinks,
      images: options?.includeImages,
      schema: options?.schema,
      prompt: options?.prompt,
      max: options?.maxChars,
      llms: options?.preferLlmsTxt !== false,
    });
    const hit = cacheEnabled ? this.cache?.get(key) : undefined;
    if (hit) return hit;

    if (canUseLlmsTxt(options)) {
      const llms = await tryLlmsTxt(url, this.fetchFn, {
        signal: options?.signal,
        headers: options?.headers,
        timeoutMs: remainingTimeout(this.timeoutMs, startedAt),
      });
      if (llms) {
        const clipped = applyClip(llms, options?.maxChars);
        if (cacheEnabled) this.cache?.set(key, clipped);
        return clipped;
      }
    }

    const needed: ProviderCapability[] = options?.schema ? ["extract"] : ["scrape"];
    if (options?.waitForMs) needed.push("js");

    const result = await this.run(
      needed,
      async (provider, signal) =>
        normalizeFormat(
          await provider.scrape(url, { ...options, signal }),
          options?.format,
          provider.name
        ),
      {
        signal: options?.signal,
        timeoutMs: this.timeoutMs,
        deadlineAt,
      }
    );
    const clipped = applyClip(result, options?.maxChars);
    if (cacheEnabled) this.cache?.set(key, clipped);
    return clipped;
  }

  async scrapeMany(urls: string[], options?: BatchScrapeOptions): Promise<ScrapeResult[]> {
    const concurrency = options?.concurrency ?? 4;
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError("concurrency must be an integer >= 1");
    }
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
    return this.run(
      ["search"],
      (provider, signal) => {
        if (!provider.search) throw new CapabilityError("search", provider.name);
        return provider.search(trimmed, { ...options, signal });
      },
      { signal: options?.signal }
    );
  }

  async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
    assertHttpUrl(url);
    const result = await this.run(
      ["crawl"],
      (provider, signal) => {
        if (!provider.crawl) throw new CapabilityError("crawl", provider.name);
        return provider.crawl(url, { ...options, signal });
      },
      { timeoutMs: this.timeoutMs * 4, signal: options?.signal }
    );
    const pages = options?.format
      ? result.pages.map((page) => normalizeFormat(page, options.format, result.provider))
      : result.pages;
    if (options?.maxChars === undefined) {
      return pages === result.pages ? result : { ...result, pages };
    }
    return {
      ...result,
      pages: pages.map((page) => applyClip(page, options.maxChars)),
    };
  }

  async map(url: string, options?: MapOptions): Promise<MapResult> {
    assertHttpUrl(url);
    return this.run(
      ["map"],
      (provider, signal) => {
        if (!provider.map) throw new CapabilityError("map", provider.name);
        return provider.map(url, { ...options, signal });
      },
      { signal: options?.signal }
    );
  }

  async extract(url: string, options: ExtractOptions): Promise<ExtractResult> {
    assertHttpUrl(url);
    if (!options?.schema) throw new Error("extract requires a JSON schema");
    return this.run(
      ["extract"],
      async (provider, signal) => {
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
      },
      { signal: options.signal }
    );
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
    runOptions: RunOptions = {}
  ): Promise<T> {
    const timeoutMs = positiveFinite(runOptions.timeoutMs ?? this.timeoutMs, "timeoutMs");
    const deadlineAt = runOptions.deadlineAt ?? Date.now() + timeoutMs;
    const callerSignal = runOptions.signal;
    if (callerSignal?.aborted) throw abortReason(callerSignal);
    const chain = this.candidates(needed);
    if (chain.length === 0) {
      throw new CapabilityError(needed.join("+"));
    }

    const errors: Error[] = [];
    const hops: FailoverHop[] = [];

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      for (let attempt = 0; attempt <= this.retries; attempt++) {
        if (Date.now() >= deadlineAt) {
          errors.push(new TimeoutError(provider.name, timeoutMs));
          break;
        }
        const controller = new AbortController();
        const signal = mergeSignals(callerSignal, controller.signal) as AbortSignal;
        let timedOut = false;
        let timeoutError: TimeoutError | undefined;
        let callerAbortHandler: (() => void) | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const operation = Promise.resolve().then(() => fn(provider, signal));
        const attemptTimeoutMs = Math.max(1, deadlineAt - Date.now());
        const timeout = new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            timedOut = true;
            timeoutError = new TimeoutError(provider.name, timeoutMs);
            controller.abort(timeoutError);
            reject(timeoutError);
          }, attemptTimeoutMs);
        });
        const callerAbort = callerSignal
          ? new Promise<T>((_, reject) => {
              callerAbortHandler = () => {
                controller.abort(callerSignal.reason);
                reject(abortReason(callerSignal));
              };
              if (callerSignal.aborted) callerAbortHandler();
              else callerSignal.addEventListener("abort", callerAbortHandler, { once: true });
            })
          : undefined;
        try {
          const value = await Promise.race(
            callerAbort ? [operation, timeout, callerAbort] : [operation, timeout]
          );
          return attachFailover(value, hops);
        } catch (err: unknown) {
          if (callerSignal?.aborted) throw abortReason(callerSignal);
          const error = timedOut
            ? timeoutError ?? new TimeoutError(provider.name, timeoutMs)
            : err instanceof Error
              ? err
              : new Error(String(err));
          errors.push(error);
          const retryable = isRetryableError(errors[errors.length - 1]);
          const hasAttemptsLeft = attempt < this.retries && retryable;
          if (hasAttemptsLeft) {
            const remaining = deadlineAt - Date.now();
            if (remaining <= 0) {
              errors.push(new TimeoutError(provider.name, timeoutMs));
              break;
            }
            try {
              await sleep(Math.min(250 * (attempt + 1), remaining), callerSignal);
            } catch (sleepError: unknown) {
              if (callerSignal?.aborted) throw abortReason(callerSignal);
              throw sleepError;
            }
            if (Date.now() >= deadlineAt) {
              errors.push(new TimeoutError(provider.name, timeoutMs));
              break;
            }
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
          if (timer) clearTimeout(timer);
          if (callerSignal && callerAbortHandler) {
            callerSignal.removeEventListener("abort", callerAbortHandler);
          }
          cleanupMergedSignal(signal);
          void operation.catch(() => undefined);
        }
      }
      if (Date.now() >= deadlineAt) break;
    }

    throw new AllProvidersFailedError(errors);
  }
}

interface RunOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  deadlineAt?: number;
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

function attachFailover<T>(result: T, hops: FailoverHop[]): T {
  if (!hops.length || result === null || typeof result !== "object") return result;
  return { ...(result as object), failedOverFrom: hops } as T;
}

function canUseLlmsTxt(options?: ScrapeOptions): boolean {
  return Boolean(
    options?.preferLlmsTxt !== false &&
      (options?.format === undefined || options.format === "markdown") &&
      !options?.schema &&
      !options?.includeLinks &&
      !options?.includeImages &&
      !options?.waitForMs &&
      options?.onlyMainContent !== false
  );
}

function normalizeFormat(
  result: ScrapeResult,
  format: ScrapeOptions["format"],
  provider: string
): ScrapeResult {
  if (!format || format === "markdown") return result;
  if (format === "text") {
    return {
      ...result,
      text: result.text ?? markdownToText(result.markdown),
    };
  }
  if (format === "html" && result.html === undefined) {
    throw new UnsupportedOptionError("format:html", provider);
  }
  if (format === "json" && result.json === undefined) {
    throw new UnsupportedOptionError("format:json", provider);
  }
  return result;
}

function remainingTimeout(timeoutMs: number, startedAt: number): number {
  return Math.max(1, timeoutMs - (Date.now() - startedAt));
}

function abortReason(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  const error = new Error(signal.reason === undefined ? "The operation was aborted" : String(signal.reason));
  error.name = "AbortError";
  return error;
}

function positiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0`);
  }
  return value;
}

function nonNegativeInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be an integer >= 0`);
  }
  return value;
}

function validateProvider(provider: ScrapeProvider): void {
  if (!provider || typeof provider !== "object") {
    throw new TypeError("Every provider must be an object");
  }
  if (typeof provider.name !== "string" || !provider.name.trim()) {
    throw new TypeError("Every provider must have a name");
  }
  if (!Array.isArray(provider.capabilities) || provider.capabilities.length === 0) {
    throw new TypeError(`Provider ${provider.name} must declare at least one capability`);
  }
  const capabilities = new Set<ProviderCapability>(["scrape", "search", "crawl", "extract", "js", "map"]);
  for (const capability of provider.capabilities) {
    if (!capabilities.has(capability)) {
      throw new TypeError(`Provider ${provider.name} declares an unknown capability: ${String(capability)}`);
    }
  }
  if (!Number.isFinite(provider.cost) || provider.cost < 0) {
    throw new RangeError(`Provider ${provider.name} must have a finite cost >= 0`);
  }
  if (provider.capabilities.includes("scrape") && typeof provider.scrape !== "function") {
    throw new TypeError(`Provider ${provider.name} advertises scrape but has no scrape method`);
  }
  if (provider.capabilities.includes("search") && typeof provider.search !== "function") {
    throw new TypeError(`Provider ${provider.name} advertises search but has no search method`);
  }
  if (provider.capabilities.includes("crawl") && typeof provider.crawl !== "function") {
    throw new TypeError(`Provider ${provider.name} advertises crawl but has no crawl method`);
  }
  if (provider.capabilities.includes("map") && typeof provider.map !== "function") {
    throw new TypeError(`Provider ${provider.name} advertises map but has no map method`);
  }
  if (
    provider.capabilities.includes("extract") &&
    typeof provider.extract !== "function" &&
    typeof provider.scrape !== "function"
  ) {
    throw new TypeError(`Provider ${provider.name} advertises extract but has no extract or scrape method`);
  }
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
