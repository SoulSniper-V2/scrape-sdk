import {
  AdapterHttp,
  CrawlOptions,
  CrawlResult,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
} from "../types.js";
import { jsonInit, requestJson } from "../http.js";

export interface SpiderConfig extends Partial<AdapterHttp> {
  apiKey: string;
}

interface SpiderPage {
  url?: string;
  title?: string;
  content?: string;
  html?: string;
  status?: number;
  error?: string;
}

export function spider(config: SpiderConfig): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  const auth = { Authorization: `Bearer ${config.apiKey}` };

  return {
    name: "spider",
    capabilities: ["scrape", "crawl", "js"],
    cost: 30,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const json = await requestJson<SpiderPage[] | SpiderPage>(
        fetchFn,
        "https://api.spider.cloud/scrape",
        {
          ...jsonInit(
            {
              url,
              return_format: options?.format === "html" ? "raw" : "markdown",
              request: options?.waitForMs ? "smart" : "http",
              metadata: true,
            },
            auth
          ),
          signal: options?.signal,
        },
        "spider"
      );
      const first = Array.isArray(json) ? json[0] : json;
      return mapPage(url, first || {}, Date.now() - startTime);
    },

    async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
      const startTime = Date.now();
      const json = await requestJson<SpiderPage[]>(
        fetchFn,
        "https://api.spider.cloud/crawl",
        {
          ...jsonInit(
            {
              url,
              limit: options?.limit ?? 10,
              depth: options?.maxDepth ?? 2,
              return_format: "markdown",
              request: "smart",
              metadata: true,
            },
            auth
          ),
          signal: options?.signal,
        },
        "spider"
      );
      const pages = (Array.isArray(json) ? json : [json]).map((page) =>
        mapPage(page.url || url, page, Date.now() - startTime)
      );
      return {
        baseUrl: url,
        pages,
        totalPages: pages.length,
        provider: "spider",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}

function mapPage(url: string, page: SpiderPage, latencyMs: number): ScrapeResult {
  return {
    url: page.url || url,
    title: page.title || "",
    markdown: page.content || "",
    html: page.html,
    metadata: { statusCode: page.status ?? 200 },
    provider: "spider",
    latencyMs,
  };
}
