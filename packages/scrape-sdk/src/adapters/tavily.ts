import {
  AdapterHttp,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
  SearchOptions,
  SearchResult,
} from "../types.js";
import { jsonInit, requestJson } from "../http.js";
import { ScrapeError } from "../errors.js";

export interface TavilyConfig extends Partial<AdapterHttp> {
  apiKey: string;
}

export function tavily(config: TavilyConfig): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  const auth = { Authorization: `Bearer ${config.apiKey}` };

  return {
    name: "tavily",
    capabilities: ["scrape", "search"],
    cost: 20,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const json = await requestJson<{
        results?: Array<{ url?: string; raw_content?: string; title?: string; images?: string[] }>;
        failed_results?: Array<{ url?: string; error?: string }>;
        usage?: { credits?: number };
      }>(
        fetchFn,
        "https://api.tavily.com/extract",
        {
          ...jsonInit(
            {
              urls: [url],
              extract_depth: options?.onlyMainContent === false ? "advanced" : "basic",
              include_images: options?.includeImages ?? false,
              format: options?.format === "text" ? "text" : "markdown",
            },
            auth
          ),
          signal: options?.signal,
        },
        "tavily"
      );

      const failed = json.failed_results?.[0];
      if (failed) {
        throw new ScrapeError(failed.error || "Tavily extract failed", "tavily");
      }

      const item = json.results?.[0] || {};
      const content = item.raw_content || "";
      return {
        url: item.url || url,
        title: firstHeading(content) || item.title || "",
        markdown: content,
        text: options?.format === "text" ? content : undefined,
        images: item.images,
        metadata: { statusCode: 200 },
        provider: "tavily",
        latencyMs: Date.now() - startTime,
        costCredits: json.usage?.credits,
      };
    },

    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
      const startTime = Date.now();
      const json = await requestJson<{
        answer?: string;
        results?: Array<{ url?: string; title?: string; content?: string; score?: number; raw_content?: string }>;
      }>(
        fetchFn,
        "https://api.tavily.com/search",
        {
          ...jsonInit(
            {
              query,
              max_results: options?.limit ?? 8,
              include_answer: options?.includeAnswer ?? false,
              include_raw_content: options?.includeRawContent ?? false,
            },
            auth
          ),
          signal: options?.signal,
        },
        "tavily"
      );

      return {
        query,
        answer: json.answer,
        results: (json.results || []).map((row) => ({
          url: row.url || "",
          title: row.title || "",
          snippet: row.content || "",
          content: row.raw_content,
          score: row.score,
        })),
        provider: "tavily",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}

function firstHeading(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}
