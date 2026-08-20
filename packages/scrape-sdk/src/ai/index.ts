import { ScrapeClient } from "../client.js";
import { ScrapeOptions } from "../types.js";

export interface AISDKToolDefinition {
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: { url: string; format?: "markdown" | "html" | "text" }) => Promise<unknown>;
}

export function scrapeTool(client: ScrapeClient): AISDKToolDefinition {
  return {
    description: "Extract clean markdown, text, or content from any live web page URL using Scrape SDK.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The absolute URL of the web page to scrape.",
        },
        format: {
          type: "string",
          enum: ["markdown", "html", "text"],
          description: "Desired output format (defaults to markdown).",
        },
      },
      required: ["url"],
    },
    execute: async ({ url, format }: { url: string; format?: "markdown" | "html" | "text" }) => {
      const result = await client.scrape(url, {
        format: format || "markdown",
        onlyMainContent: true,
      });

      return {
        url: result.url,
        title: result.title,
        content: result.markdown || result.text || result.html,
        provider: result.provider,
        latencyMs: result.latencyMs,
      };
    },
  };
}
