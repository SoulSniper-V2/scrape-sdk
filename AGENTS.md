# scrape-sdk

TypeScript client: scrape a URL to markdown with failover across Firecrawl, TinyFish, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

## If you are writing app code

`import { scrape } from "scrape-sdk"` then `await scrape(url)` is the product. `fromEnv()` if you want a client.

## If you are Cursor, Claude Code, or Codex

Host WebSearch is fine. Host WebFetch often **summarizes** the page (Claude Code uses Haiku). Use `npx -y scrape-sdk-mcp` / `scrape_url` when you need the real markdown body, `map_site`, `crawl_site`, or `extract_json`.

## If you are working in this repo

- SDK: `packages/scrape-sdk`
- MCP: `packages/mcp-server`
- Site: `apps/web`
- Tests: `npm test --workspace=scrape-sdk`
- Keep adapters honest against live vendor paths. No placeholder markdown. No homemade JSON-RPC.
