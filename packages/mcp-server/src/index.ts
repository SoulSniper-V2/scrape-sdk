#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRequire } from "node:module";
import { z } from "zod";
import { fromEnv } from "scrape-sdk";

const AGENT_MAX_CHARS = 20_000;
const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };
const agentToolShape = {
  url: z.string().url(),
  goal: z.string().min(1),
  schema: z.record(z.string(), z.unknown()).optional(),
  maxSteps: z.number().int().min(1).max(100).optional(),
  maxDurationSeconds: z.number().int().min(1).max(900).optional(),
  browserProfile: z.enum(["lite", "stealth"]).optional(),
};
type AgentToolInput = {
  url: string;
  goal: string;
  schema?: Record<string, unknown>;
  maxSteps?: number;
  maxDurationSeconds?: number;
  browserProfile?: "lite" | "stealth";
};
type ToolRegistrar = (
  name: string,
  description: string,
  shape: Record<string, unknown>,
  callback: (input: any) => ReturnType<typeof jsonText> | Promise<ReturnType<typeof jsonText>>
) => unknown;

function jsonText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function hasSearchProvider(): boolean {
  return Boolean(
    process.env.TAVILY_API_KEY ||
      process.env.FIRECRAWL_API_KEY ||
      process.env.FIRECRAWL_KEY ||
      process.env.FIRECRAWL_KEYLESS === "1" ||
      process.env.TINYFISH_API_KEY
  );
}

async function main(): Promise<void> {
  const client = fromEnv({
    cache: { ttlMs: 60_000 },
    firecrawlKeyless: process.env.FIRECRAWL_KEYLESS === "1",
    tinyfishAgent: process.env.TINYFISH_AGENT === "1",
  });
  const server = new McpServer({
    name: "scrape-sdk",
    version: packageJson.version,
  });
  // The SDK's deprecated generic overload expands aggressively with newer Zod/MCP types.
  // Runtime validation still comes from the supplied Zod shapes; keep this wrapper shallow
  // so the MCP package remains typecheckable within the CI heap budget.
  const registerTool = server.tool.bind(server) as unknown as ToolRegistrar;

  registerTool(
    "scrape_url",
    "Return the full page as markdown — the actual body, not a summary. Host WebFetch (Cursor, Claude Code, Codex) often summarizes; use scrape_url when you need the real page, vendor failover (Firecrawl → Jina → local), or a higher maxChars cap. Default 20000 chars; truncated=true means raise maxChars.",
    {
      url: z.string().url().describe("Absolute http(s) URL"),
      maxChars: z.number().int().min(500).max(100_000).optional(),
      purpose: z.string().min(1).max(2_000).optional(),
    },
    async ({ url, maxChars, purpose }) => {
      const result = await client.scrape(url, {
        format: "markdown",
        onlyMainContent: true,
        maxChars: maxChars ?? AGENT_MAX_CHARS,
        purpose,
      });
      return jsonText({
        url: result.url,
        title: result.title,
        provider: result.provider,
        latencyMs: result.latencyMs,
        truncated: result.truncated ?? false,
        charCount: result.charCount,
        failedOverFrom: result.failedOverFrom,
        content: result.markdown || result.text || result.html || "",
      });
    }
  );

  if (hasSearchProvider() && client.supports("search")) {
    registerTool(
      "search_web",
      "Search via configured providers (TinyFish, Tavily, Jina, or Firecrawl). Prefer the host WebSearch (Cursor, Claude Code, Codex) for ordinary lookups. Use this when you need a provider-backed search result set.",
      {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(20).optional(),
        purpose: z.string().min(1).max(2_000).optional(),
        location: z.string().optional(),
        language: z.string().optional(),
        includeDomains: z.array(z.string()).optional(),
        excludeDomains: z.array(z.string()).optional(),
        recencyMinutes: z.number().int().min(1).optional(),
        afterDate: z.string().optional(),
        beforeDate: z.string().optional(),
        domainType: z.enum(["web", "news", "research_paper"]).optional(),
      },
      async ({ query, limit, purpose, location, language, includeDomains, excludeDomains, recencyMinutes, afterDate, beforeDate, domainType }) => {
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
        return jsonText({
          query: result.query,
          answer: result.answer,
          provider: result.provider,
          latencyMs: result.latencyMs,
          results: result.results,
        });
      }
    );
  }

  if (client.supports("map")) {
    registerTool(
      "map_site",
      "List URLs on a site without downloading bodies. Hosts do not ship this. Then scrape_url specific pages.",
      {
        url: z.string().url(),
        limit: z.number().int().min(1).max(500).optional(),
        search: z.string().optional(),
      },
      async ({ url, limit, search }) => {
        const result = await client.map(url, { limit, search });
        return jsonText(result);
      }
    );
  }

  if (client.supports("crawl")) {
    registerTool(
      "crawl_site",
      "Crawl a site and return markdown per page. Hosts do not ship this. Expensive. Prefer map_site + scrape_url unless you need many pages in one call.",
      {
        url: z.string().url(),
        limit: z.number().int().min(1).max(50).optional(),
      },
      async ({ url, limit }) => {
        const result = await client.crawl(url, { limit: limit ?? 10, maxChars: 6_000 });
        return jsonText({
          provider: result.provider,
          totalPages: result.totalPages,
          pages: result.pages.map((p) => ({
            url: p.url,
            title: p.title,
            content: p.markdown,
          })),
        });
      }
    );
  }

  if (client.supports("extract")) {
    registerTool(
      "extract_json",
      "Extract structured JSON from a page using a JSON Schema. Hosts do not ship this. Prefer over scrape_url when you need fields, not prose.",
      {
        url: z.string().url(),
        schema: z.custom<Record<string, unknown>>((val) => typeof val === "object" && val !== null),
        prompt: z.string().optional(),
      },
      async ({ url, schema, prompt }) => {
        const result = await client.extract(url, { schema, prompt });
        return jsonText(result);
      }
    );
  }

  if (client.supports("agent")) {
    registerTool(
      "run_web_agent",
      "Run an opt-in goal-based browser agent for interactive or multi-step web tasks. This may consume paid provider credits; use scrape_url or extract_json for ordinary read-only retrieval.",
      agentToolShape,
      async (input: AgentToolInput) => {
        const result = await client.agent(input.url, {
          goal: input.goal,
          schema: input.schema,
          maxSteps: input.maxSteps,
          maxDurationSeconds: input.maxDurationSeconds,
          browserProfile: input.browserProfile,
        });
        return jsonText(result);
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
