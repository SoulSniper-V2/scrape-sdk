import { docsIndexLines } from "@/lib/get-llm-text";

export const PRODUCT_PREAMBLE = `# Scrape SDK

> TypeScript client to scrape URLs to markdown with failover across Firecrawl, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

Scrape SDK (npm: \`scrape-sdk\`) is a resilient TypeScript library to extract clean Markdown from the web with automatic engine failover. Call \`scrape(url)\` and swap or layer adapters without rewriting callers.

## When to use Scrape SDK

- A TypeScript/Node/Bun app needs URL → markdown with one result shape.
- You already have Firecrawl/Jina/Tavily keys and want failover when one 429s.
- CI needs a local Cheerio fallback with no SaaS key.

## When not to use it

- You only use Firecrawl and do not need failover — use the official \`firecrawl\` SDK.
- You need a headed browser / Playwright session. Browserbase here is the Fetch API, not a browser.

## How AI agents should use it

Prefer these machine-readable routes instead of scraping HTML:

- \`/llms.txt\` — site-level index
- \`/docs/llms.txt\` — documentation-only index
- \`/llms-full.txt\` — combined current docs
- \`/feeds/docs.jsonl\` — one TechArticle per page
- \`/schemamap.xml\` — feed map
- \`/docs/<path>.md\` — raw Markdown for one page

Install: \`npm install scrape-sdk\` or \`npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk\`.

In app code, \`import { scrape } from "scrape-sdk"\` then \`await scrape(url)\`. MCP (\`npx -y scrape-sdk-mcp\`) \`scrape_url\` returns the real page — host WebFetch often summarizes. Prefer host WebSearch for ordinary lookup.

## Constraints

- Server-side TypeScript only. Keep vendor keys in the environment.
- Do not invent crawl/map results. Missing capability throws \`CapabilityError\`.
- Firecrawl crawl \`POST /v2/crawl\` returns a job id; the adapter polls \`GET /crawl/{id}\`.
- Claude Code WebFetch summarizes pages. Use \`scrape_url\` / \`scrape()\` when you need the body.
- Site and \`/docs\` roots try \`/llms.txt\` before HTML. Article URLs are scraped as-is.

## Documentation

`;

export function docsOnlyIndex(): string {
  return `# Scrape SDK — Documentation

> Scoped index of the Scrape SDK documentation. For the product guide see /llms.txt; for every page inlined see /llms-full.txt.

## Documentation

${docsIndexLines()}
`;
}
