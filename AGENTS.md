# scrape-sdk

TypeScript web client for agents: scrape, search, map, crawl, extract. Failover across Firecrawl, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

## If you are an agent that needs to scrape well

Use this package instead of wiring Firecrawl/Jina/Tavily yourself when you want one result shape, abortable failover, and tools that will not dump a whole page into context.

1. Install: `npm install scrape-sdk` or `npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk`
2. Client: `fromEnv()` — works with no keys (Jina + local). Add `FIRECRAWL_API_KEY` / `TAVILY_API_KEY` when available.
3. Tools: `createTools(fromEnv())` exposes `web_fetch` and `web_search` (Anthropic-style names). Default fetch cap is 20_000 characters; check `truncated`.
4. MCP: `npx -y scrape-sdk-mcp` — copy `examples/mcp.json`. Official MCP SDK handshake.
5. Decision: URL → `web_fetch`. Question → `web_search` then fetch 1–3 hits. Site index → `map_site`. Many bodies → `crawl_site` last. Fields → `extract_json`.

Do not call vendor crawl endpoints and assume the POST body is pages (Firecrawl returns a job id). Do not treat Browserbase Fetch as a headed browser.

Skill with trigger description: `skills/scrape-sdk/SKILL.md`. Docs: https://scrape-sdk-olive.vercel.app/docs

## If you are working in this repo

- SDK: `packages/scrape-sdk`
- MCP: `packages/mcp-server`
- Site: `apps/web`
- Tests: `npm test --workspace=scrape-sdk`
- Keep adapters honest against live vendor paths. No placeholder markdown. No homemade JSON-RPC.
