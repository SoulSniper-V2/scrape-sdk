---
name: scrape-sdk
description: This skill should be used when the user asks to "scrape a website", "extract markdown from a url", "crawl web pages", "set up Firecrawl", "set up Jina Reader", "set up Tavily extract", "convert html to markdown", "build web scraping agent tools", "set up MCP web scraper", or "integrate scrape-sdk" in a TypeScript application.
version: 0.1.3
---

# Scrape SDK

Use `scrape-sdk` to scrape, crawl, extract, and convert web pages into clean, token-efficient ATX markdown through one provider-neutral TypeScript API with automatic failover.

## Start with current documentation

Read [https://web-three-lilac-53.vercel.app/docs](https://web-three-lilac-53.vercel.app/docs) to locate provider guides and integration patterns.

## Choose the right provider adapter

Select the adapter that fits your target site and rate limit constraints:

| Provider | Import | Scope & Characteristics |
| :--- | :--- | :--- |
| **Firecrawl** | `scrape-sdk/firecrawl` | Heavy JavaScript rendering, dynamic SPAs, full DOM crawl |
| **Jina Reader** | `scrape-sdk/jina` | Direct markdown via `r.jina.ai`, sub-second latency, optional API key |
| **Tavily Extract** | `scrape-sdk/tavily` | Optimized search & extraction tailored for LLM research agents |
| **Spider.cloud** | `scrape-sdk/spider` | Ultra-fast batch crawling engine |
| **Browserbase** | `scrape-sdk/browserbase`| Headless cloud browser sessions with proxy rotation |
| **Local Cheerio** | `scrape-sdk/local` | 100% offline, zero-token static HTML sanitization & ATX conversion |

## Install and create a client with automatic failover

Install the package with your package manager:

```bash
bun add scrape-sdk
# or npm i scrape-sdk
```

Create a client with a primary provider and automatic secondary failover:

```ts
import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

export const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // Seamlessly routes requests here if Firecrawl hits HTTP 429 rate limits
});
```

## Extract clean markdown

```ts
const result = await scraper.scrape("https://stripe.com/docs", {
  format: "markdown",
  onlyMainContent: true,
  timeoutMs: 15000,
});

console.log(result.markdown);
console.log(`Extracted via ${result.provider} in ${result.latencyMs}ms`);
```

## Vercel AI SDK Tool Integration

Plug directly into Vercel AI SDK `generateText` / `streamText` workflows:

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { scrapeTool } from "scrape-sdk/ai";

const scraper = createScrapeClient({ provider: jina() });

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    scrape: scrapeTool(scraper),
  },
  prompt: "Summarize the key announcements on https://news.ycombinator.com",
});
```

## Model Context Protocol (MCP) Server

Add to your `claude_desktop_config.json`:

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

## Unit Testing without external network calls

Use the local Cheerio engine for fast, reproducible tests:

```ts
import { createScrapeClient } from "scrape-sdk";
import { local } from "scrape-sdk/local";

const scraper = createScrapeClient({ provider: local() });
const result = await scraper.scrape("https://example.com");
```
