import { ScrapeProvider, ScrapeOptions, ScrapeResult } from "../types.js";
import { RateLimitError, ScrapeError } from "../errors.js";

export interface TavilyConfig {
  apiKey: string;
}

export function tavily(config: TavilyConfig): ScrapeProvider {
  return {
    name: "tavily",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const response = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          urls: [url],
          extract_depth: options?.onlyMainContent ? "basic" : "advanced",
        }),
      });

      if (response.status === 429) {
        throw new RateLimitError("tavily");
      }

      if (!response.ok) {
        throw new ScrapeError("Tavily Extract failed", "tavily", response.status);
      }

      const json: any = await response.json();
      const item = (json.results && json.results[0]) || {};

      return {
        url,
        title: item.title || "",
        markdown: item.raw_content || "",
        metadata: {
          images: item.images || [],
        },
        images: item.images || [],
        provider: "tavily",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
