import { ScrapeProvider, ScrapeOptions, ScrapeResult } from "../types.js";
import { RateLimitError, ScrapeError } from "../errors.js";

export interface SpiderConfig {
  apiKey: string;
}

export function spider(config: SpiderConfig): ScrapeProvider {
  return {
    name: "spider",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const response = await fetch("https://api.spider.cloud/v1/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          url,
          return_format: options?.format === "html" ? "raw" : "markdown",
          request: "smart",
        }),
      });

      if (response.status === 429) {
        throw new RateLimitError("spider");
      }

      if (!response.ok) {
        throw new ScrapeError("Spider.cloud request failed", "spider", response.status);
      }

      const json: any = await response.json();
      const first = Array.isArray(json) ? json[0] : json;

      return {
        url,
        title: first.title || "",
        markdown: first.content || "",
        html: first.html,
        metadata: {
          statusCode: response.status,
        },
        provider: "spider",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
