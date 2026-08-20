import { describe, it } from "node:test";
import assert from "node:assert";
import { createScrapeClient } from "./index.js";
import { RateLimitError } from "./errors.js";
import { ScrapeProvider, ScrapeResult } from "./types.js";
import { scrapeTool } from "./ai/index.js";

describe("ScrapeClient Core & Failover Mechanics", () => {
  it("should successfully scrape using primary provider", async () => {
    const mockPrimary: ScrapeProvider = {
      name: "mock-firecrawl",
      scrape: async (url: string): Promise<ScrapeResult> => ({
        url,
        title: "Mock Title",
        markdown: "# Mock Markdown",
        metadata: { statusCode: 200 },
        provider: "mock-firecrawl",
        latencyMs: 120,
      }),
    };

    const client = createScrapeClient({
      provider: mockPrimary,
    });

    const result = await client.scrape("https://example.com");
    assert.strictEqual(result.provider, "mock-firecrawl");
    assert.strictEqual(result.markdown, "# Mock Markdown");
  });

  it("should automatically failover to secondary provider on rate-limit (HTTP 429)", async () => {
    let failoverTriggered = false;

    const failingPrimary: ScrapeProvider = {
      name: "failing-firecrawl",
      scrape: async () => {
        throw new RateLimitError("failing-firecrawl");
      },
    };

    const workingFallback: ScrapeProvider = {
      name: "fallback-jina",
      scrape: async (url: string): Promise<ScrapeResult> => ({
        url,
        title: "Recovered Page",
        markdown: "# Recovered from Failover",
        metadata: { statusCode: 200 },
        provider: "fallback-jina",
        latencyMs: 85,
      }),
    };

    const client = createScrapeClient({
      provider: failingPrimary,
      fallback: workingFallback,
      onFailover: (_err, from, to) => {
        failoverTriggered = true;
        assert.strictEqual(from, "failing-firecrawl");
        assert.strictEqual(to, "fallback-jina");
      },
    });

    const result = await client.scrape("https://example.com");
    assert.strictEqual(result.provider, "fallback-jina");
    assert.strictEqual(result.markdown, "# Recovered from Failover");
    assert.strictEqual(failoverTriggered, true);
  });

  it("should export a valid Vercel AI SDK tool definition", async () => {
    const mockProvider: ScrapeProvider = {
      name: "mock-ai",
      scrape: async (url: string): Promise<ScrapeResult> => ({
        url,
        title: "AI Scraped",
        markdown: "Content for LLM",
        metadata: {},
        provider: "mock-ai",
        latencyMs: 50,
      }),
    };

    const client = createScrapeClient({ provider: mockProvider });
    const tool = scrapeTool(client);

    assert.strictEqual(typeof tool.description, "string");
    assert.strictEqual(typeof tool.execute, "function");

    const execResult: any = await tool.execute({ url: "https://example.com" });
    assert.strictEqual(execResult.content, "Content for LLM");
    assert.strictEqual(execResult.provider, "mock-ai");
  });
});
