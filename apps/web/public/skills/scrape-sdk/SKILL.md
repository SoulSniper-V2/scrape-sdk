---
name: scrape-sdk
description: Return the real page as markdown (not a summary). Use scrape() / scrape_url when you need the full body, failover, crawl, map, or extract. Host WebFetch often summarizes. Prefer host WebSearch for ordinary lookup.
license: MIT
compatibility: Node.js 18+. Network access. Optional FIRECRAWL_API_KEY, TAVILY_API_KEY, JINA_API_KEY, SPIDER_API_KEY, BROWSERBASE_API_KEY.
metadata:
  author: Arush Wadhawan
  version: "0.2.4"
---

# Scrape SDK

`scrape(url)` → markdown. Firecrawl / Jina / local failover without rewriting callers.

## Coding agents (Cursor, Claude Code, Codex)

Host **WebSearch** is fine for lookup. Host **WebFetch** often summarizes the page (Claude Code uses Haiku) — that is not the page. Use scrape-sdk when you need the actual body.

| Host tool | What it actually does | Use scrape-sdk when |
| :--- | :--- | :--- |
| Cursor `WebFetch` | Built-in fetch | You need full markdown, crawl, map, extract, or failover |
| Claude Code `WebFetch` | Fetches, then **Haiku summarizes** — it does not return the page | You need the real body |
| Codex `web_search` | Default **cached** snippets | Live full page, crawl, or extract |
| Host `WebSearch` | Titles + URLs | Keep using it; then `scrape_url` the hits |

MCP: `npx -y scrape-sdk-mcp`. Tools: `scrape_url` / `map_site` / `crawl_site` / `extract_json`. `search_web` only if `TAVILY_API_KEY` or `FIRECRAWL_API_KEY` is set.

## App code

```ts
import { scrape } from "scrape-sdk";

const page = await scrape("https://stripe.com/pricing");
console.log(page.markdown);
console.log(`via ${page.provider} in ${page.latencyMs}ms`);
```

No keys required (Jina + local). Optional: `FIRECRAWL_API_KEY`, `TAVILY_API_KEY`, `JINA_API_KEY`, `SPIDER_API_KEY`, `BROWSERBASE_API_KEY`.

A client is only needed when you pick providers yourself:

```ts
import { fromEnv } from "scrape-sdk";
const scraper = fromEnv();
```

In-app agents (Vercel AI SDK) have no host WebSearch — `createTools(scraper)` is for that.

## How to pick a call

| You have | Call |
| :--- | :--- |
| A specific URL | `scrape(url)` / MCP `scrape_url` |
| A site or `/docs` root | `scrape(url)` tries `/llms.txt` first, then HTML |
| A question, in an **app** you build | `search(query)` then scrape the hits |
| A question, in Cursor/Claude/Codex | Host WebSearch, then scrape_url for the full page |
| Site URL list, not bodies | `map(url)` (Firecrawl) |
| Many page bodies | `crawl(url)` last |
| Fields, not prose | `extract(url, { schema })` |

## Install

```bash
npm install scrape-sdk
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
```

Docs: https://www.scrape-sdk.com/docs

Machine-readable (do not scrape HTML):

- https://www.scrape-sdk.com/llms.txt
- https://www.scrape-sdk.com/docs/quickstart.md
- https://www.scrape-sdk.com/feeds/docs.jsonl
- https://www.scrape-sdk.com/docs/agents/machine-readable-docs

## Provider facts (do not guess endpoints)

| Adapter | API used |
| :--- | :--- |
| Firecrawl | `POST https://api.firecrawl.dev/v2/scrape`, `/search`, `/map`, `/crawl` then `GET /crawl/{id}` |
| Jina | `GET https://r.jina.ai/{url}` `Accept: application/json`; search `POST https://s.jina.ai/` |
| Tavily | `POST /extract` and `/search` with `Authorization: Bearer` |
| Spider | `POST https://api.spider.cloud/scrape` and `/crawl` |
| Browserbase | `POST https://api.browserbase.com/v1/fetch` (`format: markdown`). Not a Playwright session. No JS. |
| Local | `fetch` + cheerio main-content + turndown |
| llms.txt | `GET {origin}/llms.txt` on site/docs roots before HTML scrape |

## CLI

```bash
npx scrape-sdk <url>
npx scrape-sdk search "<query>"
npx scrape-sdk map <url>
npx scrape-sdk crawl <url> --limit 10
```

stderr prints `via jina in 340ms (firecrawl 429)` so pipes stay clean markdown.
