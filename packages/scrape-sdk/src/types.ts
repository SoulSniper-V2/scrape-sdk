export type OutputFormat = "markdown" | "html" | "text" | "json";

export type ProviderCapability = "scrape" | "search" | "crawl" | "extract" | "js" | "map" | "agent";

export type RoutingStrategy = "priority" | "cost";

export interface ScrapeOptions {
  format?: OutputFormat;
  onlyMainContent?: boolean;
  waitForMs?: number;
  /** Short task context for providers that can use intent to improve retrieval. */
  purpose?: string;
  /** Headers for the target page request, when the selected provider supports them. */
  headers?: Record<string, string>;
  includeLinks?: boolean;
  includeImages?: boolean;
  /** CSS selectors for providers that support post-render content scoping. */
  includeSelectors?: string[];
  excludeSelectors?: string[];
  /** JSON Schema for structured extraction when the provider supports `extract`. */
  schema?: Record<string, unknown>;
  prompt?: string;
  signal?: AbortSignal;
  /** Truncate markdown/text after this many characters. Agent tools default to 20000. */
  maxChars?: number;
  /**
   * For site/docs roots, try `/llms.txt` before HTML scrape. Default true.
   * Skip this for a specific article URL — we already do.
   */
  preferLlmsTxt?: boolean;
}

export interface FailoverHop {
  provider: string;
  reason: string;
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
  /** Providers that failed before this result, in order. */
  failedOverFrom?: FailoverHop[];
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
  failedOverFrom?: FailoverHop[];
}

export interface SearchOptions {
  limit?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  /** Optional intent and retrieval filters supported by some search providers. */
  purpose?: string;
  location?: string;
  language?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  recencyMinutes?: number;
  afterDate?: string;
  beforeDate?: string;
  domainType?: "web" | "news" | "research_paper";
  signal?: AbortSignal;
}

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  query: string;
  answer?: string;
  results: SearchHit[];
  provider: string;
  latencyMs: number;
  failedOverFrom?: FailoverHop[];
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
  failedOverFrom?: FailoverHop[];
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
  failedOverFrom?: FailoverHop[];
}

export interface AgentOptions {
  /** Natural-language objective for the browser agent. */
  goal: string;
  schema?: Record<string, unknown>;
  maxSteps?: number;
  maxDurationSeconds?: number;
  browserProfile?: "lite" | "stealth";
  signal?: AbortSignal;
}

export type AgentStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface AgentResult {
  url: string;
  data?: unknown;
  runId?: string;
  status: AgentStatus;
  provider: string;
  latencyMs: number;
  steps?: number;
  error?: unknown;
  failedOverFrom?: FailoverHop[];
}

export interface BatchScrapeOptions extends ScrapeOptions {
  concurrency?: number;
}

export interface ScrapeProvider {
  name: string;
  capabilities: readonly ProviderCapability[];
  /** Lower is cheaper. Used by `strategy: "cost"`. */
  cost: number;
  /** Optional per-capability override for providers with free and paid surfaces. */
  costs?: Partial<Record<ProviderCapability, number>>;
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
  search?(query: string, options?: SearchOptions): Promise<SearchResult>;
  crawl?(url: string, options?: CrawlOptions): Promise<CrawlResult>;
  extract?(url: string, options: ExtractOptions): Promise<ExtractResult>;
  map?(url: string, options?: MapOptions): Promise<MapResult>;
  agent?(url: string, options: AgentOptions): Promise<AgentResult>;
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
