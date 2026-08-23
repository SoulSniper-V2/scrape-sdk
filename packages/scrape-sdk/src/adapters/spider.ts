import {
  AdapterHttp,
  CrawlOptions,
  CrawlResult,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
} from "../types.js";
import { UnsupportedOptionError, ProviderResponseError } from "../errors.js";
import { jsonInit, requestJson } from "../http.js";
import { markdownToText } from "../markdown.js";

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
      if (options?.headers) throw new UnsupportedOptionError("headers", "spider");
      if (options?.format === "json" && !options.schema) {
        throw new UnsupportedOptionError("format:json", "spider");
      }
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
      if (first?.error) throw new ProviderResponseError("spider", first.error);
      return mapPage(url, first || {}, Date.now() - startTime, options?.format);
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
      if (!json || (Array.isArray(json) && json.length === 0)) {
        throw new ProviderResponseError("spider", "Spider returned no crawl pages");
      }
      const pages = (Array.isArray(json) ? json : [json]).map((page) =>
        mapPage(page.url || url, page, Date.now() - startTime, options?.format)
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

function mapPage(
  url: string,
  page: SpiderPage,
  latencyMs: number,
  format?: ScrapeOptions["format"]
): ScrapeResult {
  if (page.error) throw new ProviderResponseError("spider", page.error);
  if (page.content === undefined && page.html === undefined) {
    throw new ProviderResponseError("spider", "Spider returned an empty page");
  }
  const markdown = page.content || "";
  return {
    url: page.url || url,
    title: page.title || "",
    markdown,
    html: page.html,
    text: format === "text" ? markdownToText(markdown) : undefined,
    metadata: { statusCode: page.status ?? 200 },
    provider: "spider",
    latencyMs,
  };
}
