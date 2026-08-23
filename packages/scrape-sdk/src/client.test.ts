import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createScrapeClient } from "./index.js";
import {
  RateLimitError,
  AuthError,
  CapabilityError,
  InvalidUrlError,
  AllProvidersFailedError,
  TimeoutError,
} from "./errors.js";
import { ScrapeProvider, ScrapeResult, SearchResult } from "./types.js";
import { htmlToMarkdown, parseHtml } from "./markdown.js";

function ok(result: Partial<ScrapeResult> & Pick<ScrapeResult, "provider">): ScrapeResult {
  return {
    url: "https://example.com",
    title: "Example",
    markdown: "# Example",
    metadata: { statusCode: 200 },
    latencyMs: 1,
    ...result,
  };
}

describe("ScrapeClient", () => {
  it("scrapes with the primary provider", async () => {
    const client = createScrapeClient({
      provider: {
        name: "primary",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "primary", markdown: "# Hi" }),
      },
    });
    const result = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(result.provider, "primary");
    assert.equal(result.markdown, "# Hi");
  });

  it("rejects non-http URLs", async () => {
    const client = createScrapeClient({
      provider: {
        name: "primary",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "primary" }),
      },
    });
    await assert.rejects(() => client.scrape("ftp://example.com"), InvalidUrlError);
    await assert.rejects(() => client.scrape("not-a-url"), InvalidUrlError);
  });

  it("validates client and provider configuration at runtime", async () => {
    const provider = {
      name: "valid",
      capabilities: ["scrape"] as const,
      cost: 1,
      scrape: async () => ok({ provider: "valid" }),
    };
    assert.throws(() => createScrapeClient({ provider, timeoutMs: 0 }), /timeoutMs/);
    assert.throws(() => createScrapeClient({ provider, retries: -1 }), /retries/);
    assert.throws(() => createScrapeClient({ provider, cache: { maxEntries: 0 } }), /cache.maxEntries/);
    assert.throws(
      () =>
        createScrapeClient({
          provider: {
            ...provider,
            capabilities: ["scrape", "unknown"] as never,
          },
        }),
      /unknown capability/
    );
    const client = createScrapeClient({ provider });
    await assert.rejects(() => client.scrapeMany(["https://example.com"], { concurrency: 0 }), /concurrency/);
  });

  it("fails over on 429 and calls onFailover", async () => {
    let from = "";
    let to = "";
    const client = createScrapeClient({
      provider: {
        name: "firecrawl",
        capabilities: ["scrape"],
        cost: 50,
        scrape: async () => {
          throw new RateLimitError("firecrawl");
        },
      },
      fallback: {
        name: "jina",
        capabilities: ["scrape"],
        cost: 10,
        scrape: async () => ok({ provider: "jina", markdown: "# recovered" }),
      },
      retries: 0,
      onFailover: (_err, src, dest) => {
        from = src;
        to = dest;
      },
    });
    const result = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(result.provider, "jina");
    assert.equal(from, "firecrawl");
    assert.equal(to, "jina");
    assert.deepEqual(result.failedOverFrom, [{ provider: "firecrawl", reason: "429" }]);
  });

  it("does not retry auth errors onto the same provider", async () => {
    let calls = 0;
    const client = createScrapeClient({
      provider: {
        name: "locked",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          calls += 1;
          throw new AuthError("locked");
        },
      },
      retries: 3,
    });
    await assert.rejects(() => client.scrape("https://example.com", { preferLlmsTxt: false }), AllProvidersFailedError);
    assert.equal(calls, 1);
  });

  it("retries retryable errors on the same provider", async () => {
    let calls = 0;
    const client = createScrapeClient({
      provider: {
        name: "flaky",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          calls += 1;
          if (calls === 1) throw new RateLimitError("flaky");
          return ok({ provider: "flaky" });
        },
      },
      retries: 1,
    });
    const result = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(result.provider, "flaky");
    assert.equal(calls, 2);
  });

  it("retries transient fetch failures", async () => {
    let calls = 0;
    const client = createScrapeClient({
      provider: {
        name: "network-flaky",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          calls += 1;
          if (calls === 1) throw new TypeError("fetch failed");
          return ok({ provider: "network-flaky" });
        },
      },
      retries: 1,
    });
    const result = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(result.provider, "network-flaky");
    assert.equal(calls, 2);
  });

  it("propagates caller cancellation to the provider without failover", async () => {
    const controller = new AbortController();
    const reason = new Error("caller cancelled");
    let calls = 0;
    let providerSawAbort = false;
    const client = createScrapeClient({
      provider: {
        name: "abortable",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async (_url, options) => {
          calls += 1;
          return new Promise<ScrapeResult>((_resolve, reject) => {
            options?.signal?.addEventListener(
              "abort",
              () => {
                providerSawAbort = true;
                reject(options.signal?.reason);
              },
              { once: true }
            );
          });
        },
      },
      fallback: {
        name: "never-used",
        capabilities: ["scrape"],
        cost: 2,
        scrape: async () => ok({ provider: "never-used" }),
      },
      retries: 2,
    });
    const pending = client.scrape("https://example.com", {
      preferLlmsTxt: false,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(reason), 5);
    await assert.rejects(pending, (error: unknown) => {
      assert.equal(error, reason);
      return true;
    });
    assert.equal(providerSawAbort, true);
    assert.equal(calls, 1);
  });

  it("classifies provider aborts caused by the timeout as TimeoutError", async () => {
    let providerSawAbort = false;
    const client = createScrapeClient({
      timeoutMs: 5,
      retries: 0,
      provider: {
        name: "timeout-aware",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async (_url, options) =>
          new Promise<ScrapeResult>((_resolve, reject) => {
            options?.signal?.addEventListener(
              "abort",
              () => {
                providerSawAbort = true;
                reject(new DOMException("The operation was aborted", "AbortError"));
              },
              { once: true }
            );
          }),
      },
    });
    await assert.rejects(
      () => client.scrape("https://example.com", { preferLlmsTxt: false }),
      (error: unknown) => {
        assert.ok(error instanceof AllProvidersFailedError);
        assert.ok(error.errors[0] instanceof TimeoutError);
        return true;
      }
    );
    assert.equal(providerSawAbort, true);
  });

  it("bounds non-cooperative providers at the timeout", async () => {
    const startedAt = Date.now();
    const client = createScrapeClient({
      timeoutMs: 5,
      retries: 0,
      provider: {
        name: "ignores-signal",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          await new Promise((resolve) => setTimeout(resolve, 60));
          return ok({ provider: "ignores-signal" });
        },
      },
    });
    await assert.rejects(
      () => client.scrape("https://example.com", { preferLlmsTxt: false }),
      (error: unknown) => {
        assert.ok(error instanceof AllProvidersFailedError);
        assert.ok(error.errors[0] instanceof TimeoutError);
        return true;
      }
    );
    assert.ok(Date.now() - startedAt < 50);
  });

  it("routes search only to providers that support it", async () => {
    const client = createScrapeClient({
      providers: [
        {
          name: "local-only",
          capabilities: ["scrape"],
          cost: 0,
          scrape: async () => ok({ provider: "local-only" }),
        },
        {
          name: "searcher",
          capabilities: ["scrape", "search"],
          cost: 10,
          scrape: async () => ok({ provider: "searcher" }),
          search: async (query): Promise<SearchResult> => ({
            query,
            results: [{ url: "https://example.com", title: "Hit", snippet: "n" }],
            provider: "searcher",
            latencyMs: 2,
          }),
        },
      ],
    });
    const result = await client.search("typescript scraping");
    assert.equal(result.provider, "searcher");
    assert.equal(result.results[0].title, "Hit");
  });

  it("throws CapabilityError when nobody can crawl", async () => {
    const client = createScrapeClient({
      provider: {
        name: "scrape-only",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "scrape-only" }),
      },
    });
    await assert.rejects(() => client.crawl("https://example.com"), CapabilityError);
  });

  it("uses cost strategy to pick the cheaper scrape provider", async () => {
    const client = createScrapeClient({
      strategy: "cost",
      providers: [
        {
          name: "expensive",
          capabilities: ["scrape"],
          cost: 50,
          scrape: async () => ok({ provider: "expensive" }),
        },
        {
          name: "cheap",
          capabilities: ["scrape"],
          cost: 0,
          scrape: async () => ok({ provider: "cheap" }),
        },
      ],
    });
    const result = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(result.provider, "cheap");
  });

  it("caches scrape results", async () => {
    let calls = 0;
    const client = createScrapeClient({
      cache: { ttlMs: 10_000 },
      provider: {
        name: "counted",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          calls += 1;
          return ok({ provider: "counted" });
        },
      },
    });
    const first = await client.scrape("https://example.com", { preferLlmsTxt: false });
    const second = await client.scrape("https://example.com", { preferLlmsTxt: false });
    assert.equal(calls, 1);
    assert.equal(first.cached, undefined);
    assert.equal(second.cached, true);
  });

  it("isolates cached structured and plain responses", async () => {
    let calls = 0;
    const client = createScrapeClient({
      cache: { ttlMs: 10_000 },
      provider: {
        name: "structured",
        capabilities: ["scrape", "extract"],
        cost: 1,
        scrape: async (url, options) => {
          calls += 1;
          return ok({
            url,
            provider: "structured",
            markdown: options?.schema ? "# structured" : "# plain",
            json: options?.schema ? { kind: "structured" } : undefined,
          });
        },
      },
    });
    const structured = await client.scrape("https://example.com", {
      format: "json",
      schema: { type: "object" },
      preferLlmsTxt: false,
    });
    const plain = await client.scrape("https://example.com", {
      preferLlmsTxt: false,
    });
    assert.deepEqual(structured.json, { kind: "structured" });
    assert.equal(plain.json, undefined);
    assert.equal(plain.markdown, "# plain");
    assert.equal(calls, 2);
  });

  it("does not cache requests carrying target-page headers", async () => {
    let calls = 0;
    const client = createScrapeClient({
      cache: true,
      provider: {
        name: "header-aware",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          calls += 1;
          return ok({ provider: "header-aware" });
        },
      },
    });
    await client.scrape("https://example.com", {
      headers: { "X-Request": "one" },
      preferLlmsTxt: false,
    });
    await client.scrape("https://example.com", {
      headers: { "X-Request": "one" },
      preferLlmsTxt: false,
    });
    assert.equal(calls, 2);
  });

  it("scrapes a batch with bounded concurrency", async () => {
    let inflight = 0;
    let max = 0;
    const client = createScrapeClient({
      provider: {
        name: "slow",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async (url) => {
          inflight += 1;
          max = Math.max(max, inflight);
          await new Promise((r) => setTimeout(r, 20));
          inflight -= 1;
          return ok({ provider: "slow", url });
        },
      },
    });
    const results = await client.scrapeMany(
      ["https://a.com", "https://b.com", "https://c.com", "https://d.com"],
      { concurrency: 2, preferLlmsTxt: false }
    );
    assert.equal(results.length, 4);
    assert.ok(max <= 2);
  });

  it("truncates scrape output and reports charCount", async () => {
    const client = createScrapeClient({
      provider: {
        name: "long",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "long", markdown: "abcdefghij" }),
      },
    });
    const result = await client.scrape("https://example.com", { maxChars: 4, preferLlmsTxt: false });
    assert.equal(result.truncated, true);
    assert.equal(result.charCount, 10);
    assert.equal(result.markdown.length, 4);
    assert.equal(result.markdown, "abcd");
  });

  it("maps via providers that declare map", async () => {
    const client = createScrapeClient({
      provider: {
        name: "mapper",
        capabilities: ["scrape", "map"],
        cost: 1,
        scrape: async () => ok({ provider: "mapper" }),
        map: async (url) => ({
          baseUrl: url,
          links: [`${url}/docs`],
          provider: "mapper",
          latencyMs: 1,
        }),
      },
    });
    const mapped = await client.map("https://example.com");
    assert.deepEqual(mapped.links, ["https://example.com/docs"]);
  });

  it("normalizes crawl pages to the requested text format", async () => {
    const client = createScrapeClient({
      provider: {
        name: "crawl-text",
        capabilities: ["scrape", "crawl"],
        cost: 1,
        scrape: async () => ok({ provider: "crawl-text" }),
        crawl: async (url) => ({
          baseUrl: url,
          pages: [ok({ url, provider: "crawl-text", markdown: "# Heading\n\nBody" })],
          totalPages: 1,
          provider: "crawl-text",
          latencyMs: 1,
        }),
      },
    });
    const result = await client.crawl("https://example.com", { format: "text" });
    assert.equal(result.pages[0].text, "Heading\nBody");
  });

  it("reads /llms.txt on a site root before calling providers", async () => {
    let providerCalls = 0;
    const client = createScrapeClient({
      fetch: (async (input: RequestInfo | URL) => {
        const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (href === "https://example.com/llms.txt") {
          return new Response("# Example\n\n> Agent docs live here.\n\n- [Quickstart](https://example.com/docs)\n", {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
        return new Response("nope", { status: 404 });
      }) as typeof fetch,
      provider: {
        name: "primary",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          providerCalls += 1;
          return ok({ provider: "primary" });
        },
      },
    });
    const result = await client.scrape("https://example.com");
    assert.equal(result.provider, "llms.txt");
    assert.match(result.markdown, /Agent docs live here/);
    assert.equal(providerCalls, 0);
  });

  it("does not use /llms.txt when output-affecting options are requested", async () => {
    let providerCalls = 0;
    const client = createScrapeClient({
      fetch: (async (input: RequestInfo | URL) => {
        const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        assert.equal(href, "https://example.com/llms.txt");
        return new Response("# llms content that should not bypass text output", {
          status: 200,
          headers: { "content-type": "text/plain" },
        });
      }) as typeof fetch,
      provider: {
        name: "text-provider",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => {
          providerCalls += 1;
          return ok({ provider: "text-provider", markdown: "# Provider text" });
        },
      },
    });
    const result = await client.scrape("https://example.com", {
      format: "text",
      includeLinks: true,
    });
    assert.equal(result.provider, "text-provider");
    assert.equal(result.text, "Provider text");
    assert.equal(providerCalls, 1);
  });

  it("does not swap an article URL for the site llms.txt", async () => {
    let probed = false;
    const client = createScrapeClient({
      fetch: (async () => {
        probed = true;
        return new Response("# should not run", { status: 200 });
      }) as typeof fetch,
      provider: {
        name: "primary",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "primary", markdown: "# pricing" }),
      },
    });
    const result = await client.scrape("https://stripe.com/pricing");
    assert.equal(result.provider, "primary");
    assert.equal(result.markdown, "# pricing");
    assert.equal(probed, false);
  });
});

describe("markdown pipeline", () => {
  it("extracts main content and converts to ATX markdown", () => {
    const html = `<html lang="en"><head><title>Doc</title>
      <meta name="description" content="About docs">
      <link rel="canonical" href="/docs">
      </head>
      <body>
        <nav>Home About</nav>
        <article><h1>Hello</h1><p>Useful paragraph with enough text to count as main content for the extractor.</p></article>
        <footer>copyright</footer>
      </body></html>`;
    const doc = parseHtml(html, "https://example.com/page", true);
    assert.equal(doc.title, "Doc");
    assert.equal(doc.description, "About docs");
    assert.equal(doc.canonicalUrl, "https://example.com/docs");
    const md = htmlToMarkdown(doc.mainHtml);
    assert.match(md, /# Hello/);
    assert.match(md, /Useful paragraph/);
    assert.doesNotMatch(md, /copyright/);
  });
});

describe("convenience scrape()", () => {
  it("uses the injected default client", async () => {
    const { scrape, setDefaultClient, resetDefaultClient, createScrapeClient, viaLine } = await import("./index.js");
    const client = createScrapeClient({
      provider: {
        name: "injected",
        capabilities: ["scrape"],
        cost: 1,
        scrape: async () => ok({ provider: "injected", markdown: "# one shot" }),
      },
    });
    setDefaultClient(client);
    try {
      const page = await scrape("https://example.com", { preferLlmsTxt: false });
      assert.equal(page.markdown, "# one shot");
      assert.equal(viaLine(page), "via injected in 1ms");
    } finally {
      resetDefaultClient();
    }
  });

  it("viaLine includes failover hops", async () => {
    const { viaLine } = await import("./index.js");
    assert.equal(
      viaLine({
        provider: "jina",
        latencyMs: 340,
        failedOverFrom: [{ provider: "firecrawl", reason: "429" }],
      }),
      "via jina in 340ms (firecrawl 429)"
    );
  });
});

const _providerType: ScrapeProvider | undefined = undefined;
void _providerType;
