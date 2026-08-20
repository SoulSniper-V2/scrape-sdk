import { ScrapeProvider, ScrapeOptions, ScrapeResult } from "../types.js";
import { ScrapeError } from "../errors.js";

export interface BrowserbaseConfig {
  apiKey: string;
  projectId: string;
}

export function browserbase(config: BrowserbaseConfig): ScrapeProvider {
  return {
    name: "browserbase",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const response = await fetch("https://api.browserbase.com/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BB-API-Key": config.apiKey,
        },
        body: JSON.stringify({
          projectId: config.projectId,
        }),
      });

      if (!response.ok) {
        throw new ScrapeError("Browserbase session creation failed", "browserbase", response.status);
      }

      return {
        url,
        title: "Browserbase Render",
        markdown: `# Rendered Content for ${url}`,
        metadata: {
          statusCode: 200,
        },
        provider: "browserbase",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
