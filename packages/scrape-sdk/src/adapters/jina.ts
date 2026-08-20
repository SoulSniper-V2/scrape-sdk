import { ScrapeProvider, ScrapeOptions, ScrapeResult } from "../types.js";
import { RateLimitError, ScrapeError } from "../errors.js";

export interface JinaConfig {
  apiKey?: string;
  engine?: "reader" | "search";
}

export function jina(config: JinaConfig = {}): ScrapeProvider {
  return {
    name: "jina",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const headers: Record<string, string> = {
        Accept: "text/event-stream, application/json, text/plain",
        "X-Target-Selector": options?.onlyMainContent ? "main, article, #content" : "body",
        ...(options?.headers || {}),
      };

      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      if (options?.waitForMs) {
        headers["X-Wait-For-Selector"] = "body";
      }

      const targetUrl = `https://r.jina.ai/${encodeURI(url)}`;
      const response = await fetch(targetUrl, {
        headers,
      });

      if (response.status === 429) {
        throw new RateLimitError("jina");
      }

      if (!response.ok) {
        throw new ScrapeError("Jina Reader request failed", "jina", response.status);
      }

      const markdown = await response.text();
      const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : "";

      return {
        url,
        title,
        markdown,
        metadata: {
          statusCode: response.status,
        },
        provider: "jina",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
