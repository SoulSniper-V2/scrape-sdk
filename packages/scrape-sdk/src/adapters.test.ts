import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { firecrawl } from "./adapters/firecrawl.js";
import { jina } from "./adapters/jina.js";
import { tavily } from "./adapters/tavily.js";
import { browserbase } from "./adapters/browserbase.js";
import { spider } from "./adapters/spider.js";
import { local } from "./adapters/local.js";
import { ProviderResponseError, RateLimitError, UnsupportedOptionError } from "./errors.js";

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

function text(body: string, status = 200, contentType = "text/html"): Response {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

describe("Firecrawl v2 adapter", () => {
  it("POSTs /v2/scrape and maps data.markdown", async () => {
    const provider = firecrawl({
      apiKey: "fc-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.firecrawl.dev/v2/scrape");
        assert.equal(init?.method, "POST");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.url, "https://example.com");
        assert.deepEqual(body.formats, ["markdown"]);
        return json({
          success: true,
          data: {
            markdown: "# Fire",
            metadata: { title: "Fire", sourceURL: "https://example.com", statusCode: 200 },
          },
        });
      }),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.title, "Fire");
    assert.equal(result.markdown, "# Fire");
    assert.equal(result.provider, "firecrawl");
  });

  it("polls crawl jobs instead of treating POST as pages", async () => {
    let polls = 0;
    const provider = firecrawl({
      apiKey: "fc-test",
      fetch: mockFetch(async (url) => {
        if (url.endsWith("/crawl") && !url.includes("job-1")) {
          return json({ success: true, id: "job-1" });
        }
        polls += 1;
        if (polls === 1) return json({ status: "scraping", data: [] });
        return json({
          status: "completed",
          data: [
            { markdown: "# One", metadata: { title: "One", sourceURL: "https://example.com/a" } },
            { markdown: "# Two", metadata: { title: "Two", sourceURL: "https://example.com/b" } },
          ],
        });
      }),
    });
    assert.ok(provider.crawl);
    const result = await provider.crawl("https://example.com", { pollIntervalMs: 1, limit: 2 });
    assert.equal(result.totalPages, 2);
    assert.equal(result.pages[1].title, "Two");
    assert.ok(polls >= 2);
  });

  it("rejects a 2xx vendor failure envelope", async () => {
    const provider = firecrawl({
      apiKey: "fc-test",
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

  it("follows crawl pagination links", async () => {
    const requested: string[] = [];
    const provider = firecrawl({
      apiKey: "fc-test",
      fetch: mockFetch(async (url) => {
        requested.push(url);
        if (url.endsWith("/crawl")) return json({ success: true, id: "job-2" });
        if (url.endsWith("/crawl/job-2")) {
          return json({
            status: "completed",
            data: [{ markdown: "# One", metadata: { sourceURL: "https://example.com/one" } }],
            next: "https://api.firecrawl.dev/v2/crawl/job-2?page=2",
          });
        }
        return json({
          data: [{ markdown: "# Two", metadata: { sourceURL: "https://example.com/two" } }],
          next: null,
        });
      }),
    });
    assert.ok(provider.crawl);
    const result = await provider.crawl("https://example.com", { pollIntervalMs: 1, limit: 2 });
    assert.equal(result.totalPages, 2);
    assert.deepEqual(result.pages.map((page) => page.url), [
      "https://example.com/one",
      "https://example.com/two",
    ]);
    assert.ok(requested.some((url) => url.includes("page=2")));
  });

  it("rejects cross-origin crawl pagination before sending credentials", async () => {
    const requested: string[] = [];
    const provider = firecrawl({
      apiKey: "fc-secret",
      fetch: mockFetch(async (url) => {
        requested.push(url);
        if (url.endsWith("/crawl")) return json({ success: true, id: "job-3" });
        return json({
          status: "completed",
          data: [{ markdown: "# One", metadata: { sourceURL: "https://example.com/one" } }],
          next: "https://attacker.example/next",
        });
      }),
    });
    const crawl = provider.crawl;
    assert.ok(crawl);
    await assert.rejects(
      () => crawl("https://example.com", { pollIntervalMs: 1, limit: 2 }),
      ProviderResponseError
    );
    assert.deepEqual(requested, [
      "https://api.firecrawl.dev/v2/crawl",
      "https://api.firecrawl.dev/v2/crawl/job-3",
    ]);
  });

  it("maps a site via POST /v2/map", async () => {
    const provider = firecrawl({
      apiKey: "fc-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.firecrawl.dev/v2/map");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.url, "https://example.com");
        assert.equal(body.limit, 50);
        return json({
          success: true,
          links: ["https://example.com/a", { url: "https://example.com/b" }],
        });
      }),
    });
    assert.ok(provider.map);
    const result = await provider.map("https://example.com", { limit: 50 });
    assert.deepEqual(result.links, ["https://example.com/a", "https://example.com/b"]);
    assert.equal(result.provider, "firecrawl");
  });
});

describe("Jina adapter", () => {
  it("reads JSON markdown and does not prefer SSE", async () => {
    const provider = jina({
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://r.jina.ai/https://example.com");
        const accept = new Headers(init?.headers).get("accept");
        assert.equal(accept, "application/json");
        return json({ data: { title: "Jina", url: "https://example.com", content: "# From Jina" } });
      }),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.markdown, "# From Jina");
    assert.equal(result.title, "Jina");
  });

  it("surfaces 429 as RateLimitError", async () => {
    const provider = jina({
      fetch: mockFetch(async () => new Response("slow down", { status: 429 })),
    });
    await assert.rejects(() => provider.scrape("https://example.com"), RateLimitError);
  });

  it("does not forward target-page credentials to Jina", async () => {
    let called = false;
    const provider = jina({
      fetch: mockFetch(async () => {
        called = true;
        return json({ data: { content: "should not run" } });
      }),
    });
    await assert.rejects(
      () =>
        provider.scrape("https://example.com", {
          headers: { Authorization: "Bearer target-secret" },
        }),
      UnsupportedOptionError
    );
    assert.equal(called, false);
  });
});

describe("Tavily adapter", () => {
  it("uses bearer auth on /extract", async () => {
    const provider = tavily({
      apiKey: "tvly-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.tavily.com/extract");
        assert.equal(new Headers(init?.headers).get("authorization"), "Bearer tvly-test");
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(body.urls, ["https://example.com"]);
        return json({ results: [{ url: "https://example.com", raw_content: "# Extracted" }] });
      }),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.markdown, "# Extracted");
  });
});

describe("Browserbase adapter", () => {
  it("uses Fetch API and returns real content, not a placeholder", async () => {
    const provider = browserbase({
      apiKey: "bb-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.browserbase.com/v1/fetch");
        assert.equal(new Headers(init?.headers).get("x-bb-api-key"), "bb-test");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.format, "markdown");
        assert.equal(body.allowRedirects, true);
        return json({ content: "# Real page", statusCode: 200, title: "Real page" });
      }),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.markdown, "# Real page");
    assert.doesNotMatch(result.markdown, /Rendered Content for/);
  });
});

describe("Spider adapter", () => {
  it("scrapes via /scrape not /v1/crawl", async () => {
    const provider = spider({
      apiKey: "sp-test",
      fetch: mockFetch(async (url) => {
        assert.equal(url, "https://api.spider.cloud/scrape");
        return json([{ url: "https://example.com", title: "S", content: "# Spider" }]);
      }),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.markdown, "# Spider");
  });

  it("does not label markdown content as HTML when Spider omits HTML", async () => {
    const provider = spider({
      apiKey: "sp-test",
      fetch: mockFetch(async () => json([{ url: "https://example.com", content: "# Spider" }])),
    });
    const result = await provider.scrape("https://example.com", { format: "html" });
    assert.equal(result.markdown, "# Spider");
    assert.equal(result.html, undefined);
  });
});

describe("Local adapter", () => {
  it("converts HTML to markdown", async () => {
    const provider = local({
      fetch: mockFetch(async () =>
        text(`<html><head><title>Local</title></head><body><article><h1>Hi</h1><p>Body text for local parse.</p></article></body></html>`)
      ),
    });
    const result = await provider.scrape("https://example.com");
    assert.equal(result.title, "Local");
    assert.match(result.markdown, /Hi/);
    assert.equal(result.provider, "local");
  });
});
