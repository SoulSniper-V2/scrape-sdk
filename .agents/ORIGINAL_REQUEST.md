# Original User Request

## Initial Request — 2026-08-20T02:52:51Z

Build **`scrape-sdk`** — an open-source, multi-provider TypeScript SDK, CLI, MCP server, and interactive web playground for web scraping, crawling, and clean markdown extraction tailored for AI agents and developers.

Working directory: /Users/soulsniper/.gemini/antigravity/scratch/scrape_sdk
Integrity mode: development

## Requirements

### R1. Multi-Provider Core TypeScript SDK
Build a unified, type-safe SDK with normalized lifecycle methods (`scrape`, `crawl`, `extract`, `search`) supporting pluggable provider adapters:
- **Firecrawl** (`scrape-sdk/firecrawl`)
- **Jina Reader** (`scrape-sdk/jina`)
- **Tavily Extract** (`scrape-sdk/tavily`)
- **Spider.cloud** (`scrape-sdk/spider`)
- **Browserbase** (`scrape-sdk/browserbase`)
- **Local / Cheerio** (`scrape-sdk/local` — zero-token local DOM scraper fallback)
- **Automatic Fallback & Failover**: Gracefully switches to secondary providers upon 429 rate-limits or timeouts.

### R2. Agent-First Integrations & Tooling
- **Vercel AI SDK Tool**: Export ready-to-use `scrapeTool` for `ai` / `generateText` / `streamText`.
- **Stateless MCP Server**: Standard Model Context Protocol server for Claude Code, Cursor, and Hermes.
- **CLI Utility**: `npx scrape-sdk <url> --format markdown` for instant piping.

### R3. Modern Web Playground & Documentation UI
- Sleek, dark-mode Next.js / Tailwind / Shadcn UI web application (`apps/web`).
- Live URL scraping sandbox with provider comparison (latency, token count, output preview).
- Dynamic code snippet generator (TypeScript, cURL, AI SDK).

## Acceptance Criteria

### Core SDK & Adapters
- [ ] TypeScript compilation passes with strict type checking.
- [ ] Unit test suite passes for all adapters with mocked provider responses.
- [ ] Automatic fallback triggers properly when primary adapter fails.

### Agent & CLI Tools
- [ ] CLI executes and outputs formatted Markdown / JSON to stdout.
- [ ] MCP tool handlers successfully parse URLs and return structured text.
- [ ] Vercel AI SDK tool exports type-safe input/output schemas.

### Web UI
- [ ] Interactive scraper sandbox renders live with tabbed preview (Markdown, HTML, Clean Text).
- [ ] Responsive dark-mode landing page with documentation and 1-click code copying.
