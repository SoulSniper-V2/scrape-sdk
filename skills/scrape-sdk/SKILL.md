---
name: scrape-sdk
description: Scrape a URL to markdown with failover across Firecrawl, Jina, Tavily, Spider, Browserbase, and local Cheerio. Use when writing TypeScript app code that needs scrape(url), or when a coding agent needs the full page body, site map, crawl, or JSON extract — not for ordinary WebSearch/WebFetch (Cursor, Claude Code, and Codex already have those).
license: MIT
compatibility: Node.js 18+. Network access. Optional FIRECRAWL_API_KEY, TAVILY_API_KEY, JINA_API_KEY, SPIDER_API_KEY, BROWSERBASE_API_KEY.
metadata:
  author: Arush Wadhawan
  version: "0.2.1"
---

# Scrape SDK

TypeScript client: `scrape(url)` → markdown. Swap Firecrawl / Jina / local without rewriting callers. Same shape as Email SDK / Domain SDK.

## Coding agents (Cursor, Claude Code, Codex)

They already have **WebSearch** and **WebFetch**. Do not use this MCP as a replacement.

| Host tool | What it actually does | Use scrape-sdk instead when |
| :--- | :--- | :--- |
| Cursor `WebSearch` / `WebFetch` | Built-in lookup | You need full markdown, crawl, map, or extract |
| Claude Code `WebFetch` | Fetches, then **Haiku summarizes** — it does not return the page | You need the real body |
| Claude Code `WebSearch` | Titles + URLs | Fine; keep using it |
| Codex `web_search` | Default **cached** snippets, not a full scrape | Live full page, crawl, or extract |

MCP: `npx -y scrape-sdk-mcp`. Tools are named `scrape_url` / `map_site` / `crawl_site` / `extract_json` so they do not collide with host `WebFetch`. `search_web` is only registered if `TAVILY_API_KEY` or `FIRECRAWL_API_KEY` is set.

## App code (the main product)

```ts
import { fromEnv } from "scrape-sdk";

const scraper = fromEnv();
const page = await scraper.scrape("https://example.com", {
  format: "markdown",
  onlyMainContent: true,
  maxChars: 20_000,
});
```

`fromEnv()` always ends with Jina + local. Optional: `FIRECRAWL_API_KEY`, `TAVILY_API_KEY`, `JINA_API_KEY`, `SPIDER_API_KEY`, `BROWSERBASE_API_KEY`.

In-app agents (Vercel AI SDK) have no host WebSearch — `createTools(scraper)` is for that, not for Cursor.

## How to pick a call

| You have | Call |
| :--- | :--- |
| A specific URL | `scrape(url)` / MCP `scrape_url` |
| A question, in an **app** you build | `search(query)` then scrape the hits |
| A question, in Cursor/Claude/Codex | Host WebSearch, then scrape_url only if you need the full page |
| Site URL list, not bodies | `map(url)` (Firecrawl) |
| Many page bodies | `crawl(url)` last |
| Fields, not prose | `extract(url, { schema })` |

## Install

```bash
npm install scrape-sdk
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
```

Docs: https://scrape-sdk-olive.vercel.app/docs

Machine-readable (do not scrape HTML):

- https://scrape-sdk-olive.vercel.app/llms.txt
- https://scrape-sdk-olive.vercel.app/docs/quickstart.md
- https://scrape-sdk-olive.vercel.app/feeds/docs.jsonl
- https://scrape-sdk-olive.vercel.app/docs/agents/machine-readable-docs

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
