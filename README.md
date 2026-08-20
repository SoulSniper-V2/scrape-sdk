# ⚡ Scrape SDK

<p align="center">
  <a href="https://www.scrape-sdk.dev"><img alt="scrape-sdk.dev" src="https://shieldcn.dev/badge/scrape-sdk.dev.svg?variant=secondary&mode=dark" /></a>
  <a href="https://www.npmjs.com/package/scrape-sdk"><img alt="npm version" src="https://shieldcn.dev/npm/scrape-sdk.svg?variant=secondary&mode=dark" /></a>
  <a href="https://github.com/SoulSniper-V2/scrape-sdk/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/SoulSniper-V2/scrape-sdk/stars.svg?variant=branded&mode=dark" /></a>
  <a href="https://x.com/be_arsh"><img alt="Follow @be_arsh on X" src="https://shieldcn.dev/x/follow/be_arsh.svg?variant=branded&mode=dark" /></a>
</p>

One TypeScript client for web scraping, crawling, and clean markdown extraction across Firecrawl, Jina, Tavily, Spider, Browserbase, and Local Cheerio.

- Pluggable adapters for **Firecrawl**, **Jina Reader**, **Tavily Extract**, **Spider.cloud**, **Browserbase**, and **Local Cheerio**
- Built-in automatic failover if your primary provider hits 429 rate limits or timeouts
- First-class **Vercel AI SDK** tool (`scrapeTool`) and **Model Context Protocol (MCP)** server
- Clean CLI (`npx scrape-sdk <url>`) with instant markdown piping to terminal or clipboard
- Open source, MIT licensed

## Install

```bash
npm install scrape-sdk
```

## Quickstart

```typescript
import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

const scraper = createScrapeClient({
  // Primary provider
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  
  // Automatic failover if primary rate-limits or fails!
  fallback: jina(),
});

// Clean, unified markdown extraction
const result = await scraper.scrape("https://news.ycombinator.com", {
  format: "markdown",
  onlyMainContent: true,
});

console.log(result.markdown);
console.log(`Scraped via ${result.provider} in ${result.latencyMs}ms`);
```

## Supported Providers

| Provider | Import | Auth Required | JS Rendering | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Firecrawl** | `scrape-sdk/firecrawl` | Yes (`apiKey`) | Yes | Production crawling & deep extraction |
| **Jina Reader** | `scrape-sdk/jina` | Optional | Yes | Instant, free markdown extraction |
| **Tavily Extract** | `scrape-sdk/tavily` | Yes (`apiKey`) | Yes | Search + content synthesis |
| **Spider.cloud** | `scrape-sdk/spider` | Yes (`apiKey`) | Yes | High-speed batch crawling |
| **Browserbase** | `scrape-sdk/browserbase` | Yes (`apiKey`) | Full Headless | Complex interactive SPAs |
| **Local Cheerio** | `scrape-sdk/local` | None | No (Static HTML) | Free, zero-token local parsing |

## Agent Integration (Vercel AI SDK)

```typescript
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
  prompt: "What are the top stories on https://news.ycombinator.com?",
});
```

## CLI Usage

```bash
# Scrape any URL directly to markdown
npx scrape-sdk https://stripe.com --format markdown

# Pipe clean web markdown into an LLM or clipboard
npx scrape-sdk https://stripe.com | pbcopy
```

## License

MIT © [Arush Wadhawan](https://x.com/be_arsh)
