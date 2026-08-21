import { z } from "zod";
import { ScrapeClient } from "../client.js";
import { AGENT_MAX_CHARS } from "../clip.js";

const fetchInput = z.object({
  url: z.string().url().describe("Absolute http(s) URL to read"),
  maxChars: z
    .number()
    .int()
    .min(500)
    .max(100_000)
    .optional()
    .describe(`Max characters of page text to return. Defaults to ${AGENT_MAX_CHARS}. Increase only if you need the rest of a truncated page.`),
});

const searchInput = z.object({
  query: z.string().min(1).describe("Web search query"),
  limit: z.number().int().min(1).max(20).optional().describe("Max results. Defaults to 8."),
});

const crawlInput = z.object({
  url: z.string().url().describe("Starting URL for the crawl"),
  limit: z.number().int().min(1).max(100).optional().describe("Max pages. Defaults to 10."),
  maxDepth: z.number().int().min(1).max(5).optional().describe("Max link depth. Defaults to 2."),
});

const extractInput = z.object({
  url: z.string().url().describe("Page to extract structured data from"),
  schema: z.record(z.string(), z.unknown()).describe("JSON Schema describing the object to extract"),
  prompt: z.string().optional().describe("Optional extraction hint"),
});

const mapInput = z.object({
  url: z.string().url().describe("Site URL whose internal links you want listed"),
  limit: z.number().int().min(1).max(500).optional().describe("Max URLs. Defaults to 100."),
  search: z.string().optional().describe("Optional filter, e.g. blog or /docs"),
});

/** AI SDK 5+/6 tool shape: `inputSchema` + `execute`. Compatible with generateText({ tools }). */
export interface AgentTool<TIn extends z.ZodType, TOut> {
  description: string;
  inputSchema: TIn;
  execute: (input: z.infer<TIn>) => Promise<TOut>;
}

/** Industry name: web_fetch. Read one known URL into markdown without blowing the context window. */
export function scrapeTool(client: ScrapeClient): AgentTool<typeof fetchInput, {
  url: string;
  title: string;
  content: string;
  provider: string;
  latencyMs: number;
  cached: boolean;
  truncated: boolean;
  charCount: number;
}> {
  return {
    description:
      "web_fetch: scrape a known URL into clean markdown. Use when you already have a URL. Do not use this to discover pages — use web_search or map_site first. Content is truncated so it fits in context; if truncated is true and you need the rest, call again with a higher maxChars.",
    inputSchema: fetchInput,
    execute: async ({ url, maxChars }) => {
      const result = await client.scrape(url, {
        format: "markdown",
        onlyMainContent: true,
        maxChars: maxChars ?? AGENT_MAX_CHARS,
      });
      return {
        url: result.url,
        title: result.title,
        content: result.markdown || result.text || result.html || "",
        provider: result.provider,
        latencyMs: result.latencyMs,
        cached: result.cached ?? false,
        truncated: result.truncated ?? false,
        charCount: result.charCount ?? result.markdown.length,
      };
    },
  };
}

export const webFetchTool = scrapeTool;

export function searchTool(client: ScrapeClient): AgentTool<typeof searchInput, {
  query: string;
  answer?: string;
  results: { url: string; title: string; snippet: string; content?: string; score?: number }[];
  provider: string;
  latencyMs: number;
}> {
  return {
    description:
      "web_search: search the live web. Use when you do not already have a URL. Then web_fetch the 1–3 best results. Do not crawl from search snippets.",
    inputSchema: searchInput,
    execute: async ({ query, limit }) => {
      const result = await client.search(query, { limit });
      return {
        query: result.query,
        answer: result.answer,
        results: result.results,
        provider: result.provider,
        latencyMs: result.latencyMs,
      };
    },
  };
}

export const webSearchTool = searchTool;

export function crawlTool(client: ScrapeClient): AgentTool<typeof crawlInput, {
  baseUrl: string;
  totalPages: number;
  provider: string;
  pages: { url: string; title: string; content: string }[];
}> {
  return {
    description:
      "Crawl a site and return markdown per page. Expensive. Prefer map_site to list URLs, then web_fetch specific pages. Use crawl only when you need many pages of a known site in one call.",
    inputSchema: crawlInput,
    execute: async ({ url, limit, maxDepth }) => {
      const result = await client.crawl(url, { limit, maxDepth, maxChars: 6_000 });
      return {
        baseUrl: result.baseUrl,
        totalPages: result.totalPages,
        provider: result.provider,
        pages: result.pages.map((page) => ({
          url: page.url,
          title: page.title,
          content: page.markdown,
        })),
      };
    },
  };
}

export function extractTool(client: ScrapeClient): AgentTool<typeof extractInput, {
  url: string;
  data: unknown;
  provider: string;
  latencyMs: number;
}> {
  return {
    description:
      "Extract structured JSON from a page using a JSON Schema. Prefer this over web_fetch when you need fields (price, title, author), not prose.",
    inputSchema: extractInput,
    execute: async ({ url, schema, prompt }) => {
      const result = await client.extract(url, { schema, prompt });
      return {
        url: result.url,
        data: result.data,
        provider: result.provider,
        latencyMs: result.latencyMs,
      };
    },
  };
}

export function mapTool(client: ScrapeClient): AgentTool<typeof mapInput, {
  baseUrl: string;
  links: string[];
  provider: string;
  latencyMs: number;
}> {
  return {
    description:
      "List URLs on a site without downloading page bodies. Use before crawl when you need to see what exists (docs index, sitemap-style discovery).",
    inputSchema: mapInput,
    execute: async ({ url, limit, search }) => {
      const result = await client.map(url, { limit, search });
      return {
        baseUrl: result.baseUrl,
        links: result.links,
        provider: result.provider,
        latencyMs: result.latencyMs,
      };
    },
  };
}

/**
 * Agent toolset using the names models already know: web_fetch + web_search.
 * crawl_site / extract_json / map_site are added only when a provider can do them.
 */
export function createTools(client: ScrapeClient) {
  return {
    web_fetch: scrapeTool(client),
    ...(client.supports("search") ? { web_search: searchTool(client) } : {}),
    ...(client.supports("map") ? { map_site: mapTool(client) } : {}),
    ...(client.supports("crawl") ? { crawl_site: crawlTool(client) } : {}),
    ...(client.supports("extract") ? { extract_json: extractTool(client) } : {}),
  };
}
