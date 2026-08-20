import { ScrapeProvider, ScrapeOptions, ScrapeResult, CrawlOptions, CrawlResult } from "../types.js";
import { RateLimitError, ScrapeError } from "../errors.js";

export interface FirecrawlConfig {
  apiKey: string;
  apiUrl?: string;
}

export function firecrawl(config: FirecrawlConfig): ScrapeProvider {
  const apiUrl = config.apiUrl || "https://api.firecrawl.dev/v1";

  return {
    name: "firecrawl",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: [options?.format === "html" ? "html" : "markdown"],
          onlyMainContent: options?.onlyMainContent ?? true,
          waitFor: options?.waitForMs,
          headers: options?.headers,
        }),
      });

      if (response.status === 429) {
        throw new RateLimitError("firecrawl");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ScrapeError(errorText || "Firecrawl request failed", "firecrawl", response.status);
      }

      const json: any = await response.json();
      const data = json.data || {};

      return {
        url,
        title: data.metadata?.title || "",
        markdown: data.markdown || "",
        html: data.html,
        links: data.links || [],
        metadata: {
          description: data.metadata?.description,
          language: data.metadata?.language,
          statusCode: data.metadata?.statusCode || response.status,
          ogImage: data.metadata?.ogImage,
          ...data.metadata,
        },
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      };
    },

    async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          url,
          limit: options?.limit || 10,
          maxDepth: options?.maxDepth || 2,
        }),
      });

      if (!response.ok) {
        throw new ScrapeError("Firecrawl crawl initiation failed", "firecrawl", response.status);
      }

      const json: any = await response.json();
      const pages: ScrapeResult[] = (json.data || []).map((p: any) => ({
        url: p.metadata?.sourceURL || url,
        title: p.metadata?.title || "",
        markdown: p.markdown || "",
        metadata: p.metadata || {},
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      }));

      return {
        baseUrl: url,
        pages,
        totalPages: pages.length,
        provider: "firecrawl",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
