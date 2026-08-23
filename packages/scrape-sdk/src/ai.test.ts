import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createScrapeClient } from "./index.js";
import { scrapeTool, createTools } from "./ai/index.js";
import { ScrapeProvider, ScrapeResult } from "./types.js";

const mock: ScrapeProvider = {
  name: "mock",
  capabilities: ["scrape", "search", "crawl", "extract", "map"],
  cost: 1,
  scrape: async (url): Promise<ScrapeResult> => ({
    url,
    title: "T",
    markdown: "Content for LLM",
    metadata: {},
    provider: "mock",
    latencyMs: 1,
  }),
  search: async (query) => ({
    query,
    results: [{ url: "https://example.com", title: "T", snippet: "s" }],
    provider: "mock",
    latencyMs: 1,
  }),
  map: async (url) => ({
    baseUrl: url,
    links: [`${url}/a`],
    provider: "mock",
    latencyMs: 1,
  }),
  crawl: async (url) => ({
    baseUrl: url,
    pages: [],
    totalPages: 0,
    provider: "mock",
    latencyMs: 1,
  }),
  extract: async (url) => ({
    url,
    data: { ok: true },
    provider: "mock",
    latencyMs: 1,
  }),
};

describe("AI SDK tools", () => {
  it("exposes inputSchema instead of parameters", async () => {
    const client = createScrapeClient({
      provider: mock,
      fetch: (async () => new Response("no", { status: 404 })) as typeof fetch,
    });
    const tool = scrapeTool(client);
    assert.equal(typeof tool.execute, "function");
    assert.ok(tool.inputSchema);
    assert.equal("parameters" in tool, false);
    const executed = await tool.execute({ url: "https://example.com" });
    assert.equal(executed.content, "Content for LLM");
    assert.equal(executed.truncated, false);
  });

  it("createTools uses scrape_url and search_web names", () => {
    const client = createScrapeClient({ provider: mock });
    const tools = createTools(client);
    assert.ok(tools.scrape_url);
    assert.ok(tools.search_web);
    assert.ok(tools.map_site);
    assert.ok(tools.crawl_site);
    assert.ok(tools.extract_json);
    assert.equal("web_fetch" in tools, false);
  });
});
