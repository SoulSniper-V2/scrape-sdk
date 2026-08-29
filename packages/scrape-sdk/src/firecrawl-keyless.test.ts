import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { firecrawl } from "./adapters/firecrawl.js";
import { ProviderResponseError } from "./errors.js";

type Handler = (url: string, init?: RequestInit) => Promise<Response> | Response;

function mockFetch(handler: Handler): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return handler(url, init);
  }) as typeof fetch;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Firecrawl keyless compatibility", () => {
  it("scrapes without an Authorization header when no API key is configured", async () => {
    const provider = firecrawl({
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.firecrawl.dev/v2/scrape");
        assert.equal(new Headers(init?.headers).get("authorization"), null);
        return json({
          success: true,
          data: {
            markdown: "# Keyless",
            metadata: { title: "Keyless", sourceURL: "https://example.com", creditsUsed: 1 },
          },
        });
      }),
    });

    const result = await provider.scrape("https://example.com");
    assert.equal(result.title, "Keyless");
    assert.equal(result.markdown, "# Keyless");
    assert.equal(result.costCredits, 1);
  });

  it("uses bearer Authorization when an API key is configured", async () => {
    const provider = firecrawl({
      apiKey: "fc-test",
      fetch: mockFetch(async (_url, init) => {
        assert.equal(new Headers(init?.headers).get("authorization"), "Bearer fc-test");
        return json({
          success: true,
          data: {
            markdown: "# Keyed",
            metadata: { title: "Keyed", sourceURL: "https://example.com" },
          },
        });
      }),
    });

    const result = await provider.scrape("https://example.com");
    assert.equal(result.title, "Keyed");
    assert.equal(result.markdown, "# Keyed");
  });

  it("rejects an existing failed response envelope", async () => {
    const provider = firecrawl({
      fetch: mockFetch(async () => json({ success: false, error: "blocked by vendor" })),
    });

    await assert.rejects(
      () => provider.scrape("https://example.com"),
      (error: unknown) => {
        assert.ok(error instanceof ProviderResponseError);
        assert.match((error as Error).message, /blocked by vendor/);
        return true;
      }
    );
  });
});
