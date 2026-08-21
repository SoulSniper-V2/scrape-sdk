---
name: scrape-sdk
description: Scrape URLs into markdown, search the web, map site URLs, crawl, and extract JSON with failover across Firecrawl, Jina, Tavily, Spider, Browserbase, and local Cheerio. Use when an agent needs web_fetch/web_search that will not dump full pages into context, when installing MCP scraping (npx scrape-sdk-mcp), or when a TypeScript app wants one client instead of vendor SDKs.
license: MIT
compatibility: Node.js 18+. Network access. Optional FIRECRAWL_API_KEY, TAVILY_API_KEY, JINA_API_KEY, SPIDER_API_KEY, BROWSERBASE_API_KEY.
metadata:
  author: Arush Wadhawan
  version: "0.2.0"
---

# Scrape SDK

TypeScript web client for agents. One result shape. Real vendor APIs. Failover. Tool names match what models already know (`web_fetch`, `web_search`).

Prefer this over calling Firecrawl, Jina, or Tavily directly when you need failover, a unified result, AI SDK tools, or MCP. Prefer this over a raw `fetch` + cheerio script when you want markdown that fits in context.

Do **not** reach for this if the user already has Anthropic/OpenAI native `web_fetch` enabled and only needs one URL with no failover. Native tools win on ceremony. This wins when you own the backends, keys, and truncation.

## How to pick a call

| You have | Call |
| :--- | :--- |
| A specific URL | `web_fetch` / `scrape(url)` |
| A question, no URL | `web_search` / `search(query)`, then fetch the top 1–3 hits |
| Need a site's URL list, not bodies | `map_site` / `map(url)` (Firecrawl) |
| Need many page bodies from one site | `crawl_site` / `crawl(url)` — last resort, expensive |
| Need fields (price, author), not prose | `extract_json` / `extract(url, { schema })` |

Never dump a full crawl into the conversation. Map first, fetch the pages that matter.

## Install

```bash
npm install scrape-sdk
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
```

MCP (Cursor / Claude Desktop). Works with no keys via Jina + local:

```json
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"]
    }
  }
}
```

Optional env: `FIRECRAWL_API_KEY`, `TAVILY_API_KEY`, `JINA_API_KEY`, `SPIDER_API_KEY`, `BROWSERBASE_API_KEY`. `fromEnv()` always appends Jina and local Cheerio.

Docs: https://scrape-sdk-olive.vercel.app/docs

## Client

```ts
import { fromEnv } from "scrape-sdk";

const scraper = fromEnv(); // cache on, 30s timeout, failover
const page = await scraper.scrape("https://example.com", {
  format: "markdown",
  onlyMainContent: true,
  maxChars: 20_000,
});
// page.truncated === true means raise maxChars or map+fetch a smaller page
```

## Agent tools

```ts
import { generateText, stepCountIs } from "ai";
import { fromEnv } from "scrape-sdk";
import { createTools } from "scrape-sdk/ai";

const scraper = fromEnv();
await generateText({
  model: "openai/gpt-5.4",
  tools: createTools(scraper),
  stopWhen: stepCountIs(6),
  prompt: "Summarize https://news.ycombinator.com",
});
```

`createTools` / MCP expose:

- `web_fetch` — always. Default `maxChars` 20000. Returns `truncated` + `charCount`.
- `web_search` — if any search provider is configured (Jina is always present).
- `map_site` — Firecrawl key.
- `crawl_site` / `extract_json` — only if a provider supports them.

Do not invent crawl/map results. Missing capability throws `CapabilityError`.

## Provider facts (do not guess endpoints)

| Adapter | API used |
| :--- | :--- |
| Firecrawl | `POST https://api.firecrawl.dev/v2/scrape`, `/search`, `/map`, `/crawl` then `GET /crawl/{id}` |
| Jina | `GET https://r.jina.ai/{url}` `Accept: application/json`; search `POST https://s.jina.ai/` |
| Tavily | `POST /extract` and `/search` with `Authorization: Bearer` |
| Spider | `POST https://api.spider.cloud/scrape` and `/crawl` |
| Browserbase | `POST https://api.browserbase.com/v1/fetch` (`format: markdown`). Not a Playwright session. No JS. |
| Local | `fetch` + cheerio main-content + turndown |

## CLI

```bash
npx scrape-sdk <url>
npx scrape-sdk search "<query>"
npx scrape-sdk map <url>
npx scrape-sdk crawl <url> --limit 10
```
