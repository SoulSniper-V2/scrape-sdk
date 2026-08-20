export type OutputFormat = "markdown" | "html" | "text" | "json";

export interface ScrapeOptions {
  format?: OutputFormat;
  onlyMainContent?: boolean;
  waitForMs?: number;
  headers?: Record<string, string>;
  includeLinks?: boolean;
  includeImages?: boolean;
  schema?: Record<string, unknown>;
}

export interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  html?: string;
  text?: string;
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
  costTokens?: number;
}

export interface CrawlOptions extends ScrapeOptions {
  maxDepth?: number;
  limit?: number;
  allowSubdomains?: boolean;
  matchPatterns?: string[];
  excludePatterns?: string[];
}

export interface CrawlResult {
  baseUrl: string;
  pages: ScrapeResult[];
  totalPages: number;
  provider: string;
  latencyMs: number;
}

export interface ScrapeProvider {
  name: string;
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
  crawl?(url: string, options?: CrawlOptions): Promise<CrawlResult>;
}

export interface ScrapeClientConfig {
  provider: ScrapeProvider;
  fallback?: ScrapeProvider | ScrapeProvider[];
  timeoutMs?: number;
  retries?: number;
  onFailover?: (error: Error, fromProvider: string, toProvider: string) => void;
}
