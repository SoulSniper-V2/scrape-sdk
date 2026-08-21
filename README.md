# Scrape SDK

One TypeScript client for scraping, searching, crawling, and extracting structured data from the web. Swap Firecrawl, Jina, Tavily, Spider, Browserbase, and local Cheerio without rewriting your agent.

- Honest adapters against current vendor APIs (Firecrawl v2, Jina JSON, Tavily Bearer, Browserbase Fetch)
- Abortable timeouts, retry-only-on-retryable-errors, and automatic failover
- `search()`, `map()` for URL lists, `crawl()` with job polling, `extract()` with JSON Schema, `scrapeMany()`
- Agent tools named `web_fetch` / `web_search` with a 20k-char default so pages do not blow context
- Vercel AI SDK tools (`inputSchema`) and a real MCP server (`npx scrape-sdk-mcp`)
- CLI: `npx scrape-sdk <url>`
- MIT licensed

## Install

```bash
npm install scrape-sdk
```

## Quickstart

```typescript
import { createScrapeClient, fromEnv } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";

const scraper = createScrapeClient({
  providers: [
    firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! }),
    jina(),
    local(),
  ],
  strategy: "priority", // or "cost" to prefer cheaper backends first
  cache: { ttlMs: 60_000 },
});

const page = await scraper.scrape("https://news.ycombinator.com", {
  format: "markdown",
  onlyMainContent: true,
});

console.log(page.markdown);
console.log(`via ${page.provider} in ${page.latencyMs}ms`);
```

Or build from environment keys:

```typescript
import { fromEnv } from "scrape-sdk";

const scraper = fromEnv(); // FIRECRAWL_API_KEY, TAVILY_API_KEY, JINA_API_KEY, ...
await scraper.search("firecrawl vs jina reader");
```

## What each method does

| Method | Use when |
| :--- | :--- |
| `scrape(url)` | You already have a URL. Pass `maxChars` for LLM callers. |
| `search(query)` | You need to find URLs |
| `map(url)` | You need a site's URL list, not bodies (Firecrawl) |
| `crawl(url)` | You need many page bodies from one site |
| `extract(url, { schema })` | You need structured JSON |
| `scrapeMany(urls)` | You have a list of URLs |

Providers that do not support an operation are skipped. If none can, you get a `CapabilityError` instead of a fake result.

## Providers

| Provider | Import | Needs key | scrape | search | map | crawl | extract | JS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Firecrawl v2 | `scrape-sdk/firecrawl` | yes | yes | yes | yes | yes (polls job id) | yes | yes |
| Jina | `scrape-sdk/jina` | optional | yes | yes | — | — | — | yes |
| Tavily | `scrape-sdk/tavily` | yes | extract | yes | — | — | — | — |
| Spider.cloud | `scrape-sdk/spider` | yes | `/scrape` | — | — | `/crawl` | — | yes |
| Browserbase | `scrape-sdk/browserbase` | yes | Fetch API | — | — | — | JSON schema | — |
| Local | `scrape-sdk/local` | no | static HTML | — | — | — | — | no |

Browserbase is the Fetch endpoint (`POST /v1/fetch`), not a Playwright session. It does not execute page JavaScript.

## Agent tools (Vercel AI SDK)

```typescript
import { generateText, stepCountIs } from "ai";
import { fromEnv } from "scrape-sdk";
import { createTools } from "scrape-sdk/ai";

const scraper = fromEnv();

const { text } = await generateText({
  model: "openai/gpt-5.4",
  tools: createTools(scraper),
  stopWhen: stepCountIs(6),
  prompt: "What are the top stories on Hacker News right now?",
});
```

Tools use AI SDK `inputSchema` (Zod), not the old `parameters` field. Names: `web_fetch`, `web_search`, plus `map_site` / `crawl_site` / `extract_json` when the client supports them. `web_fetch` defaults to 20_000 characters and returns `truncated`.

## MCP

```json
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-...",
        "TAVILY_API_KEY": "tvly-..."
      }
    }
  }
}
```

The server is built on `@modelcontextprotocol/sdk` (initialize handshake included). Tools: `web_fetch` and `web_search`, plus `map_site` / `crawl_site` / `extract_json` when keys allow. Fetch is truncated by default so agents do not eat the whole context window.

## CLI

```bash
npx scrape-sdk https://stripe.com
npx scrape-sdk search "vercel ai sdk tools"
npx scrape-sdk map https://docs.firecrawl.dev
npx scrape-sdk crawl https://docs.firecrawl.dev --limit 5 --json
npx scrape-sdk scrape https://example.com --provider local
```

## License

MIT © [Arush Wadhawan](https://x.com/be_arsh)
