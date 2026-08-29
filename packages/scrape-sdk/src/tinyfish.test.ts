import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tinyfish } from "./adapters/tinyfish.js";
import { ProviderResponseError, UnsupportedOptionError } from "./errors.js";

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

describe("TinyFish adapter", () => {
  it("maps Fetch results, forwards supported options, and converts text output", async () => {
    const provider = tinyfish({
      apiKey: "tf-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(url, "https://api.fetch.tinyfish.ai");
        assert.equal(init?.method, "POST");
        assert.equal(new Headers(init?.headers).get("x-api-key"), "tf-test");
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        assert.deepEqual(body, {
          urls: ["https://example.com/start"],
          format: "markdown",
          links: true,
          image_links: true,
          purpose: "Read the article body",
          include_selectors: ["article"],
          exclude_selectors: [".comments"],
        });
        return json({
          results: [
            {
              url: "https://example.com/start",
              final_url: "https://example.com/article",
              title: "Example article",
              description: "An article",
              language: "en",
              text: "# Heading\n\n- Body [link](https://example.com/link)",
              links: ["https://example.com/link"],
              image_links: ["https://example.com/image.png"],
              latency_ms: 42,
              format: "markdown",
            },
          ],
          errors: [],
        });
      }),
    });

    const result = await provider.scrape("https://example.com/start", {
      format: "text",
      includeLinks: true,
      includeImages: true,
      purpose: "Read the article body",
      includeSelectors: ["article"],
      excludeSelectors: [".comments"],
    });

    assert.equal(result.url, "https://example.com/article");
    assert.equal(result.title, "Example article");
    assert.equal(result.markdown, "# Heading\n\n- Body [link](https://example.com/link)");
    assert.equal(result.text, "Heading\nBody link");
    assert.deepEqual(result.links, ["https://example.com/link"]);
    assert.deepEqual(result.images, ["https://example.com/image.png"]);
    assert.equal(result.metadata.description, "An article");
    assert.equal(result.metadata.language, "en");
    assert.equal(result.metadata.finalUrl, "https://example.com/article");
    assert.equal(result.latencyMs, 42);
    assert.equal(result.costCredits, 0);
  });

  it("turns a requested URL's 200-envelope error into a ProviderResponseError", async () => {
    const provider = tinyfish({
      apiKey: "tf-test",
      fetch: mockFetch(async () =>
        json({
          results: [],
          errors: [{ url: "https://example.com", error: "bot_blocked", status: 403 }],
        })
      ),
    });

    await assert.rejects(
      () => provider.scrape("https://example.com"),
      (error: unknown) => {
        assert.ok(error instanceof ProviderResponseError);
        assert.match(error.message, /bot_blocked/);
        assert.match(error.message, /HTTP 403/);
        assert.equal((error as ProviderResponseError & { code?: string }).code, "bot_blocked");
        return true;
      }
    );
  });

  it("rejects Fetch options TinyFish cannot honor", async () => {
    const provider = tinyfish({
      apiKey: "tf-test",
      fetch: mockFetch(async () => json({ results: [], errors: [] })),
    });

    await assert.rejects(
      () => provider.scrape("https://example.com", { headers: {} }),
      UnsupportedOptionError
    );
    await assert.rejects(
      () => provider.scrape("https://example.com", { waitForMs: 0 }),
      UnsupportedOptionError
    );
    await assert.rejects(
      () => provider.scrape("https://example.com", { onlyMainContent: false }),
      UnsupportedOptionError
    );
  });

  it("searches across pages and maps the documented query parameters without limit", async () => {
    const requested: URL[] = [];
    const provider = tinyfish({
      apiKey: "tf-test",
      fetch: mockFetch(async (url, init) => {
        assert.equal(init?.method, "GET");
        assert.equal(new Headers(init?.headers).get("x-api-key"), "tf-test");
        const endpoint = new URL(url);
        requested.push(endpoint);
        assert.equal(endpoint.searchParams.get("query"), "web automation");
        assert.equal(endpoint.searchParams.get("purpose"), "Find current tools");
        assert.equal(endpoint.searchParams.get("location"), "US");
        assert.equal(endpoint.searchParams.get("language"), "en");
        assert.equal(endpoint.searchParams.get("include_domains"), "docs.example.com,github.com");
        assert.equal(endpoint.searchParams.get("exclude_domains"), "social.example.com");
        assert.equal(endpoint.searchParams.get("after_date"), "2026-01-01");
        assert.equal(endpoint.searchParams.get("before_date"), "2026-08-01");
        assert.equal(endpoint.searchParams.get("domain_type"), "news");
        assert.equal(endpoint.searchParams.has("limit"), false);

        const page = Number(endpoint.searchParams.get("page"));
        if (page === 0) {
          return json({
            page: 0,
            total_results: 15,
            results: Array.from({ length: 10 }, (_, index) => ({
              title: `Title ${index}`,
              url: `https://example.com/${index}`,
              snippet: `Snippet ${index}`,
              ...(index === 0 ? { date: "2026-08-01", publisher: "Example News" } : {}),
            })),
          });
        }
        assert.equal(page, 1);
        return json({
          page: 1,
          total_results: 15,
          results: Array.from({ length: 5 }, (_, index) => ({
            title: `Title ${index + 10}`,
            url: `https://example.com/${index + 10}`,
            snippet: `Snippet ${index + 10}`,
          })),
        });
      }),
    });

    const result = await provider.search!("web automation", {
      limit: 12,
      purpose: "Find current tools",
      location: "US",
      language: "en",
      includeDomains: ["docs.example.com", "github.com"],
      excludeDomains: ["social.example.com"],
      afterDate: "2026-01-01",
      beforeDate: "2026-08-01",
      domainType: "news",
    });

    assert.deepEqual(requested.map((endpoint) => endpoint.searchParams.get("page")), ["0", "1"]);
    assert.equal(result.results.length, 12);
    assert.equal(result.results[11].title, "Title 11");
    assert.deepEqual(result.results[0].metadata, { date: "2026-08-01", publisher: "Example News" });
  });

  it("does not expose paid Agent or Extract capabilities by default", async () => {
    const provider = tinyfish({ apiKey: "tf-test", fetch: mockFetch(async () => json({})) });

    assert.deepEqual(provider.capabilities, ["scrape", "search", "js"]);
    assert.equal(provider.agent, undefined);
    assert.equal(provider.extract, undefined);
    assert.equal(provider.cost, 0);
    assert.equal(provider.costs?.scrape, 0);
    assert.equal(provider.costs?.search, 0);
  });

  it("rejects incompatible Search options instead of silently dropping them", async () => {
    const provider = tinyfish({ apiKey: "tf-test", fetch: mockFetch(async () => json({ results: [] })) });
    await assert.rejects(
      () => provider.search!("web", { includeRawContent: true }),
      UnsupportedOptionError
    );
    await assert.rejects(
      () => provider.search!("web", { recencyMinutes: 60, afterDate: "2026-01-01" }),
      (error: unknown) => {
        assert.ok(error instanceof ProviderResponseError);
        assert.match(error.message, /recencyMinutes/);
        return true;
      }
    );
  });

  it("polls enabled Agent runs and uses the same surface for Extract and schema scrape", async () => {
    let nextRun = 0;
    const polls = new Map<string, number>();
    const provider = tinyfish({
      apiKey: "tf-test",
      enableAgent: true,
      pollIntervalMs: 0,
      fetch: mockFetch(async (url, init) => {
        assert.equal(new Headers(init?.headers).get("x-api-key"), "tf-test");
        if (url.endsWith("/v1/automation/run-async")) {
          assert.equal(init?.method, "POST");
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
          assert.equal(body.url, "https://example.com");
          assert.equal(body.goal, nextRun === 0 ? "Read the title" : "Extract the price");
          assert.deepEqual(body.output_schema, { type: "object" });
          assert.equal(body.browser_profile, nextRun === 0 ? "stealth" : undefined);
          assert.deepEqual(
            body.agent_config,
            nextRun === 0 ? { max_steps: 5, max_duration_seconds: 30 } : {}
          );
          const runId = `run-${nextRun}`;
          nextRun += 1;
          polls.set(runId, 0);
          return json({ run_id: runId, error: null });
        }

        const match = url.match(/\/v1\/runs\/(run-\d+)$/);
        assert.ok(match);
        const runId = match[1];
        const count = polls.get(runId) ?? 0;
        polls.set(runId, count + 1);
        if (count === 0) return json({ run_id: runId, status: "RUNNING", num_of_steps: 2 });
        return json({
          run_id: runId,
          status: "COMPLETED",
          result: nextRun === 1 ? { title: "Example" } : { price: 42 },
          num_of_steps: 5,
        });
      }),
    });

    assert.deepEqual(provider.capabilities, ["scrape", "search", "js", "agent", "extract"]);
    assert.equal(provider.costs?.scrape, 0);
    assert.equal(provider.costs?.search, 0);
    assert.ok((provider.costs?.agent ?? 0) > 0);
    assert.ok(provider.agent);
    assert.ok(provider.extract);

    const agent = await provider.agent("https://example.com", {
      goal: "Read the title",
      schema: { type: "object" },
      browserProfile: "stealth",
      maxSteps: 5,
      maxDurationSeconds: 30,
    });
    assert.equal(agent.status, "completed");
    assert.deepEqual(agent.data, { title: "Example" });
    assert.equal(agent.runId, "run-0");
    assert.equal(agent.steps, 5);

    const extracted = await provider.extract("https://example.com", {
      prompt: "Extract the price",
      schema: { type: "object" },
    });
    assert.deepEqual(extracted.data, { price: 42 });

    const scraped = await provider.scrape("https://example.com", {
      schema: { type: "object" },
      prompt: "Extract the price",
    });
    assert.deepEqual(scraped.json, { price: 42 });
  });

  it("cancels an Agent run before rethrowing caller cancellation", async () => {
    const controller = new AbortController();
    const reason = new Error("stop agent");
    const calls: string[] = [];
    const provider = tinyfish({
      apiKey: "tf-test",
      enableAgent: true,
      pollIntervalMs: 0,
      fetch: mockFetch(async (url, init) => {
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.endsWith("/v1/automation/run-async")) return json({ run_id: "run-cancel" });
        if (url.endsWith("/v1/runs/run-cancel")) {
          controller.abort(reason);
          return json({ run_id: "run-cancel", status: "RUNNING" });
        }
        assert.equal(url, "https://agent.tinyfish.ai/v1/runs/run-cancel/cancel");
        assert.equal(init?.method, "POST");
        return json({ run_id: "run-cancel", status: "CANCELLED" });
      }),
    });

    await assert.rejects(
      () => provider.agent!("https://example.com", { goal: "Wait", signal: controller.signal }),
      (error: unknown) => {
        assert.equal(error, reason);
        return true;
      }
    );
    assert.deepEqual(calls, [
      "POST https://agent.tinyfish.ai/v1/automation/run-async",
      "GET https://agent.tinyfish.ai/v1/runs/run-cancel",
      "POST https://agent.tinyfish.ai/v1/runs/run-cancel/cancel",
    ]);
  });
});
