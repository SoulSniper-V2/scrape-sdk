# scrape-sdk

TypeScript client: scrape a URL to markdown with failover across Firecrawl, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

## If you are writing app code

`fromEnv()` + `scraper.scrape(url)` is the product. Same idea as Email SDK / Domain SDK.

## If you are Cursor, Claude Code, or Codex

You already have WebSearch and WebFetch. Do not use this MCP to search. Claude Code WebFetch **summarizes** the page (Haiku); Codex search defaults to a **cache**. Use `npx -y scrape-sdk-mcp` only when you need the full markdown body, `map_site`, `crawl_site`, or `extract_json`. Tool name is `scrape_url` so it does not collide with host `WebFetch`.

## If you are working in this repo

- SDK: `packages/scrape-sdk`
- MCP: `packages/mcp-server`
- Site: `apps/web`
- Tests: `npm test --workspace=scrape-sdk`
- Keep adapters honest against live vendor paths. No placeholder markdown. No homemade JSON-RPC.
