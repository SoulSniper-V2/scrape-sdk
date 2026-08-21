#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fromEnv } from "scrape-sdk";

const AGENT_MAX_CHARS = 20_000;

function jsonText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

async function main(): Promise<void> {
  const client = fromEnv({ cache: { ttlMs: 60_000 } });
  const server = new McpServer({
    name: "scrape-sdk",
    version: "0.2.0",
  });

  server.tool(
    "web_fetch",
    "Read a known URL into clean markdown. Truncated to fit context (default 20000 chars). If truncated is true and you need more, pass a higher maxChars. Use web_search when you do not have a URL.",
    {
      url: z.string().url().describe("Absolute http(s) URL"),
      maxChars: z.number().int().min(500).max(100_000).optional(),
    },
    async ({ url, maxChars }) => {
      const result = await client.scrape(url, {
        format: "markdown",
        onlyMainContent: true,
        maxChars: maxChars ?? AGENT_MAX_CHARS,
      });
      return jsonText({
        url: result.url,
        title: result.title,
        provider: result.provider,
        latencyMs: result.latencyMs,
        truncated: result.truncated ?? false,
        charCount: result.charCount,
        content: result.markdown || result.text || result.html || "",
      });
    }
  );

  if (client.supports("search")) {
    server.tool(
      "web_search",
      "Search the live web. Use when you do not already have a URL. Then web_fetch the best 1–3 results.",
      {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(20).optional(),
      },
      async ({ query, limit }) => {
        const result = await client.search(query, { limit });
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
    server.tool(
      "map_site",
      "List URLs on a site without downloading bodies. Cheaper than crawl. Then web_fetch specific pages.",
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
    server.tool(
      "crawl_site",
      "Crawl a site and return markdown per page. Expensive. Prefer map_site + web_fetch unless you need many pages in one call.",
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
    server.tool(
      "extract_json",
      "Extract structured JSON from a page using a JSON Schema. Prefer over web_fetch when you need fields, not prose.",
      {
        url: z.string().url(),
        schema: z.record(z.string(), z.unknown()),
        prompt: z.string().optional(),
      },
      async ({ url, schema, prompt }) => {
        const result = await client.extract(url, { schema, prompt });
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
