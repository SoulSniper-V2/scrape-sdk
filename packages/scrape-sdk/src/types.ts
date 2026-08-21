export type OutputFormat = "markdown" | "html" | "text" | "json";

export type ProviderCapability = "scrape" | "search" | "crawl" | "extract" | "js" | "map";

export type RoutingStrategy = "priority" | "cost";

export interface ScrapeOptions {
  format?: OutputFormat;
  onlyMainContent?: boolean;
  waitForMs?: number;
  headers?: Record<string, string>;
  includeLinks?: boolean;
  includeImages?: boolean;
  /** JSON Schema for structured extraction when the provider supports `extract`. */
  schema?: Record<string, unknown>;
  prompt?: string;
  signal?: AbortSignal;
  /** Truncate markdown/text after this many characters. Agent tools default to 20000. */
  maxChars?: number;
}

export interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  html?: string;
  text?: string;
  json?: unknown;
  links?: string[];
  images?: string[];
  metadata: {
    description?: string;
    language?: string;
    canonicalUrl?: string;
    statusCode?: number;
    ogImage?: string;
    [key: string]: unknown;
  };
  provider: string;
  latencyMs: number;
  costCredits?: number;
  cached?: boolean;
  truncated?: boolean;
  charCount?: number;
}

export interface CrawlOptions extends ScrapeOptions {
  maxDepth?: number;
  limit?: number;
  allowSubdomains?: boolean;
  matchPatterns?: string[];
  excludePatterns?: string[];
  pollIntervalMs?: number;
}

export interface CrawlResult {
  baseUrl: string;
  pages: ScrapeResult[];
  totalPages: number;
  provider: string;
  latencyMs: number;
}

export interface SearchOptions {
  limit?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  signal?: AbortSignal;
}

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  score?: number;
}

export interface SearchResult {
  query: string;
  answer?: string;
  results: SearchHit[];
  provider: string;
  latencyMs: number;
}

export interface MapOptions {
  limit?: number;
  search?: string;
  signal?: AbortSignal;
}

export interface MapResult {
  baseUrl: string;
  links: string[];
  provider: string;
  latencyMs: number;
}

export interface ExtractOptions {
  schema: Record<string, unknown>;
  prompt?: string;
  signal?: AbortSignal;
}

export interface ExtractResult {
  url: string;
  data: unknown;
  provider: string;
  latencyMs: number;
}

export interface BatchScrapeOptions extends ScrapeOptions {
  concurrency?: number;
}

export interface ScrapeProvider {
  name: string;
  capabilities: readonly ProviderCapability[];
  /** Lower is cheaper. Used by `strategy: "cost"`. */
  cost: number;
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
  search?(query: string, options?: SearchOptions): Promise<SearchResult>;
  crawl?(url: string, options?: CrawlOptions): Promise<CrawlResult>;
  extract?(url: string, options: ExtractOptions): Promise<ExtractResult>;
  map?(url: string, options?: MapOptions): Promise<MapResult>;
}

export interface MemoryCacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}

export interface ScrapeClientConfig {
  /** Preferred: ordered provider list. First match for the operation is tried first when strategy is `priority`. */
  providers?: ScrapeProvider[];
  /** Back-compat alias for a single primary provider. */
  provider?: ScrapeProvider;
  fallback?: ScrapeProvider | ScrapeProvider[];
  timeoutMs?: number;
  /** Extra attempts per provider, only on retryable errors. Default 1. */
  retries?: number;
  strategy?: RoutingStrategy;
  cache?: boolean | MemoryCacheConfig;
  fetch?: typeof fetch;
  onFailover?: (error: Error, fromProvider: string, toProvider: string) => void;
}

export interface AdapterHttp {
  fetch: typeof fetch;
}
