export const revalidate = false;

export function GET() {
  const content = `# Scrape SDK - Full Documentation

## Overview
Scrape SDK provides a single typed contract for all major web scraping engines (Firecrawl, Jina Reader, Tavily, Spider, Browserbase, Local Cheerio) with automatic failover, Vercel AI SDK tools, and Model Context Protocol (MCP) server support.

## Installation
\`\`\`bash
bun add scrape-sdk
# or
npm install scrape-sdk
\`\`\`

## Install Agent Skill (for Claude, Cursor, Antigravity, Hermes)
\`\`\`bash
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
# Add -g to install globally across all projects
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk -g
\`\`\`

## Providers
- **Firecrawl**: JavaScript SPA rendering and deep site crawling.
- **Jina Reader**: Zero-config fast markdown extraction via r.jina.ai.
- **Tavily Extract**: Optimized search & extract for autonomous LLM research pipelines.
- **Local Cheerio**: Zero-token static DOM cleaner and ATX markdown parser.

## Vercel AI SDK
\`\`\`ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { scrapeTool } from "scrape-sdk/ai";

const scraper = createScrapeClient({ provider: jina() });
const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: { scrape: scrapeTool(scraper) },
  prompt: "Extract https://news.ycombinator.com",
});
\`\`\`
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
