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
  purpose: z.string().min(1).max(2_000).optional().describe("Optional reason the page is being fetched"),
});

const searchInput = z.object({
  query: z.string().min(1).describe("Web search query"),
  limit: z.number().int().min(1).max(20).optional().describe("Max results. Defaults to 8."),
  purpose: z.string().min(1).max(2_000).optional().describe("Optional search intent"),
  location: z.string().optional().describe("Country code, e.g. US"),
  language: z.string().optional().describe("Language code, e.g. en"),
  includeDomains: z.array(z.string()).optional().describe("Domains to include"),
  excludeDomains: z.array(z.string()).optional().describe("Domains to exclude"),
  recencyMinutes: z.number().int().min(1).optional().describe("Freshness window in minutes"),
  afterDate: z.string().optional().describe("Lower date bound YYYY-MM-DD"),
  beforeDate: z.string().optional().describe("Upper date bound YYYY-MM-DD"),
  domainType: z.enum(["web", "news", "research_paper"]).optional().describe("Search corpus"),
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

const agentInput = z.object({
  url: z.string().url().describe("Starting URL for the browser agent"),
  goal: z.string().min(1).describe("Natural-language goal for the web agent"),
  schema: z.record(z.string(), z.unknown()).optional().describe("Optional JSON Schema for structured output"),
  maxSteps: z.number().int().min(1).max(100).optional().describe("Maximum agent steps"),
  maxDurationSeconds: z.number().int().min(1).max(900).optional().describe("Maximum run duration"),
  browserProfile: z.enum(["lite", "stealth"]).optional().describe("Browser profile to use"),
});

/** AI SDK 5+/6 tool shape: `inputSchema` + `execute`. Compatible with generateText({ tools }). */
export interface AgentTool<TIn extends z.ZodType, TOut> {
  description: string;
  inputSchema: TIn;
  execute: (input: z.infer<TIn>) => Promise<TOut>;
}

/** Read one known URL into markdown without blowing the context window. */
export function scrapeTool(client: ScrapeClient): AgentTool<typeof fetchInput, {
  url: string;
  title: string;
  content: string;
  provider: string;
  latencyMs: number;
  cached: boolean;
  truncated: boolean;
  charCount: number;
  failedOverFrom?: { provider: string; reason: string }[];
}> {
  return {
    description:
      "Return the full page as markdown — the actual body, not a summary. Use this when you already have a URL. Host WebFetch often summarizes; this does not. Do not use this to discover pages — search or map_site first. Content is truncated so it fits in context; if truncated is true and you need the rest, call again with a higher maxChars.",
    inputSchema: fetchInput,
    execute: async ({ url, maxChars, purpose }) => {
      const result = await client.scrape(url, {
        format: "markdown",
        onlyMainContent: true,
        maxChars: maxChars ?? AGENT_MAX_CHARS,
        purpose,
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
        failedOverFrom: result.failedOverFrom,
      };
    },
  };
}

export const webFetchTool = scrapeTool;

export function searchTool(client: ScrapeClient): AgentTool<typeof searchInput, {
  query: string;
  answer?: string;
  results: { url: string; title: string; snippet: string; content?: string; score?: number; metadata?: Record<string, unknown> }[];
  provider: string;
  latencyMs: number;
}> {
  return {
    description:
      "Search the live web via configured scrape providers (TinyFish, Tavily, Jina, Firecrawl). Use in an app agent that has no host WebSearch. Then scrape_url the 1–3 best results.",
    inputSchema: searchInput,
    execute: async ({ query, limit, purpose, location, language, includeDomains, excludeDomains, recencyMinutes, afterDate, beforeDate, domainType }) => {
      const result = await client.search(query, {
        limit,
        purpose,
        location,
        language,
        includeDomains,
        excludeDomains,
        recencyMinutes,
        afterDate,
        beforeDate,
        domainType,
      });
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
      "Crawl a site and return markdown per page. Expensive. Prefer map_site to list URLs, then scrape_url specific pages. Use crawl only when you need many pages of a known site in one call.",
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
      "Extract structured JSON from a page using a JSON Schema. Prefer this over scrape_url when you need fields (price, title, author), not prose.",
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

export function agentTool(client: ScrapeClient): AgentTool<typeof agentInput, {
  url: string;
  data?: unknown;
  runId?: string;
  status: string;
  provider: string;
  latencyMs: number;
  steps?: number;
  error?: unknown;
}> {
  return {
    description:
      "Run an opt-in goal-based web agent for interactive or multi-step sites. This may consume paid provider credits; use scrape_url or extract_json for ordinary read-only page retrieval.",
    inputSchema: agentInput,
    execute: async ({ url, goal, schema, maxSteps, maxDurationSeconds, browserProfile }) =>
      client.agent(url, { goal, schema, maxSteps, maxDurationSeconds, browserProfile }),
  };
}

/**
 * Tools for an app you build (Vercel AI SDK). In Cursor / Claude Code / Codex,
 * host WebFetch often summarizes — use scrape_url (MCP or these tools) for the real page.
 */
export function createTools(client: ScrapeClient) {
  return {
    scrape_url: scrapeTool(client),
    ...(client.supports("search") ? { search_web: searchTool(client) } : {}),
    ...(client.supports("map") ? { map_site: mapTool(client) } : {}),
    ...(client.supports("crawl") ? { crawl_site: crawlTool(client) } : {}),
    ...(client.supports("extract") ? { extract_json: extractTool(client) } : {}),
    ...(client.supports("agent") ? { run_web_agent: agentTool(client) } : {}),
  };
}
