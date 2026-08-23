import {
  AdapterHttp,
  CrawlOptions,
  CrawlResult,
  ExtractOptions,
  ExtractResult,
  MapOptions,
  MapResult,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
  SearchOptions,
  SearchResult,
} from "../types.js";
import { jsonInit, requestJson, sleep } from "../http.js";
import { ProviderResponseError, ScrapeError } from "../errors.js";
import { markdownToText } from "../markdown.js";

export interface FirecrawlConfig extends Partial<AdapterHttp> {
  apiKey: string;
  apiUrl?: string;
}

interface FirecrawlDoc {
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  images?: string[];
  json?: unknown;
  metadata?: Record<string, unknown> & {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
    ogImage?: string;
  };
}

interface FirecrawlCrawlStatus {
  success?: boolean;
  status?: string;
  data?: FirecrawlDoc[];
  next?: string | null;
  error?: string;
}

export function firecrawl(config: FirecrawlConfig): ScrapeProvider {
  const apiUrl = (config.apiUrl || "https://api.firecrawl.dev/v2").replace(/\/$/, "");
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  const auth = { Authorization: `Bearer ${config.apiKey}` };

  return {
    name: "firecrawl",
    capabilities: ["scrape", "search", "crawl", "extract", "js", "map"],
    cost: 50,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const formats: unknown[] = [options?.format === "html" ? "html" : "markdown"];
      if (options?.includeLinks) formats.push("links");
      if (options?.includeImages) formats.push("images");
      if (options?.schema) {
        formats.push({
          type: "json",
          schema: options.schema,
          prompt: options.prompt,
        });
      }

      const json = await requestJson<{ success?: boolean; data?: FirecrawlDoc; error?: string }>(
        fetchFn,
        `${apiUrl}/scrape`,
        {
          ...jsonInit(
            {
              url,
              formats,
              onlyMainContent: options?.onlyMainContent ?? true,
              waitFor: options?.waitForMs,
              headers: options?.headers,
            },
            auth
          ),
          signal: options?.signal,
        },
        "firecrawl"
      );

      if (json.success === false || !json.data || !hasDocumentContent(json.data)) {
        throw new ProviderResponseError("firecrawl", json.error || "Firecrawl returned no scrape data");
      }
      const data = json.data;
      return mapDoc(url, data, Date.now() - startTime, options?.format);
    },

    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
      const startTime = Date.now();
      const json = await requestJson<{
        success?: boolean;
        data?: { web?: Array<{ url?: string; title?: string; description?: string; markdown?: string }> } | Array<{ url?: string; title?: string; description?: string }>;
        error?: string;
      }>(
        fetchFn,
        `${apiUrl}/search`,
        {
          ...jsonInit(
            {
              query,
              limit: options?.limit ?? 8,
            },
            auth
          ),
          signal: options?.signal,
        },
        "firecrawl"
      );

      if (json.success === false || json.data === undefined) {
        throw new ProviderResponseError("firecrawl", json.error || "Firecrawl returned no search data");
      }
      const rows = Array.isArray(json.data) ? json.data : json.data.web || [];
      return {
        query,
        results: rows.map((row) => ({
          url: row.url || "",
          title: row.title || "",
          snippet: ("description" in row ? row.description : "") || "",
          content: "markdown" in row && typeof row.markdown === "string" ? row.markdown : undefined,
        })),
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      };
    },

    async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
      const startTime = Date.now();
      const started = await requestJson<{ success?: boolean; id?: string; error?: string }>(
        fetchFn,
        `${apiUrl}/crawl`,
        {
          ...jsonInit(
            {
              url,
              limit: options?.limit ?? 10,
              maxDiscoveryDepth: options?.maxDepth ?? 2,
              allowSubdomains: options?.allowSubdomains ?? false,
              includePaths: options?.matchPatterns,
              excludePaths: options?.excludePatterns,
              scrapeOptions: {
                formats: [options?.format === "html" ? "html" : "markdown"],
                onlyMainContent: options?.onlyMainContent ?? true,
              },
            },
            auth
          ),
          signal: options?.signal,
        },
        "firecrawl"
      );

      if (started.success === false) {
        throw new ProviderResponseError("firecrawl", started.error || "Firecrawl crawl failed to start");
      }
      const jobId = started.id;
      if (!jobId) {
        throw new ProviderResponseError("firecrawl", started.error || "Firecrawl crawl did not return a job id");
      }

      const pollMs = options?.pollIntervalMs ?? 1500;
      let statusJson: FirecrawlCrawlStatus = {};

      for (;;) {
        if (options?.signal?.aborted) throw options.signal.reason ?? new Error("Aborted");
        statusJson = await requestJson(
          fetchFn,
          `${apiUrl}/crawl/${jobId}`,
          { headers: auth, signal: options?.signal },
          "firecrawl"
        );
        if (statusJson.success === false || statusJson.error) {
          throw new ProviderResponseError("firecrawl", statusJson.error || "Firecrawl crawl status failed");
        }
        if (statusJson.status === "completed" || statusJson.status === "failed") break;
        await sleep(pollMs, options?.signal);
      }

      if (statusJson.status === "failed") {
        throw new ScrapeError(statusJson.error || "Firecrawl crawl failed", "firecrawl");
      }

      const docs = [...(statusJson.data || [])];
      let next = statusJson.next;
      const pageLimit = options?.limit ?? 10;
      while (next && docs.length < pageLimit) {
        const page = await requestJson<FirecrawlCrawlStatus>(
          fetchFn,
          resolveNextPage(next, apiUrl),
          { headers: auth, signal: options?.signal },
          "firecrawl"
        );
        if (page.success === false || page.error) {
          throw new ProviderResponseError("firecrawl", page.error || "Firecrawl crawl pagination failed");
        }
        docs.push(...(page.data || []));
        next = page.next;
      }

      const pages = docs.slice(0, pageLimit).map((doc) =>
        mapDoc(String(doc.metadata?.sourceURL || url), doc, Date.now() - startTime, options?.format)
      );

      return {
        baseUrl: url,
        pages,
        totalPages: pages.length,
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      };
    },

    async extract(url: string, options: ExtractOptions): Promise<ExtractResult> {
      const scraped = await this.scrape(url, {
        schema: options.schema,
        prompt: options.prompt,
        signal: options.signal,
        format: "json",
      });
      return {
        url: scraped.url,
        data: scraped.json ?? {},
        provider: "firecrawl",
        latencyMs: scraped.latencyMs,
      };
    },

    async map(url: string, options?: MapOptions): Promise<MapResult> {
      const startTime = Date.now();
      const json = await requestJson<{
        success?: boolean;
        links?: Array<string | { url?: string }>;
        error?: string;
      }>(
        fetchFn,
        `${apiUrl}/map`,
        {
          ...jsonInit(
            {
              url,
              limit: options?.limit ?? 100,
              ...(options?.search ? { search: options.search } : {}),
            },
            auth
          ),
          signal: options?.signal,
        },
        "firecrawl"
      );
      if (json.success === false || json.links === undefined) {
        throw new ProviderResponseError("firecrawl", json.error || "Firecrawl returned no map data");
      }
      const links = json.links
        .map((link) => (typeof link === "string" ? link : String(link.url || "")))
        .filter(Boolean);
      return {
        baseUrl: url,
        links,
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}

function resolveNextPage(next: string, apiUrl: string): string {
  try {
    return new URL(next, `${apiUrl}/`).href;
  } catch {
    throw new ProviderResponseError("firecrawl", "Firecrawl returned an invalid crawl pagination URL");
  }
}

function mapDoc(
  url: string,
  data: FirecrawlDoc,
  latencyMs: number,
  format?: ScrapeOptions["format"]
): ScrapeResult {
  if (!hasDocumentContent(data)) {
    throw new ProviderResponseError("firecrawl", "Firecrawl returned an empty document");
  }
  const metadata = data.metadata || {};
  const markdown = data.markdown || "";
  return {
    url: String(metadata.sourceURL || url),
    title: String(metadata.title || ""),
    markdown,
    html: data.html || data.rawHtml,
    text: format === "text" ? markdownToText(markdown) : undefined,
    json: data.json,
    links: data.links,
    images: data.images,
    metadata: {
      description: metadata.description as string | undefined,
      language: metadata.language as string | undefined,
      statusCode: (metadata.statusCode as number | undefined) ?? 200,
      ogImage: metadata.ogImage as string | undefined,
      ...metadata,
    },
    provider: "firecrawl",
    latencyMs,
  };
}

function hasDocumentContent(data: FirecrawlDoc): boolean {
  return data.markdown !== undefined || data.html !== undefined || data.rawHtml !== undefined || data.json !== undefined;
}
