export const revalidate = false;

export function GET() {
  const content = `# Scrape SDK

> TypeScript client for scrape, search, crawl, and extract across Firecrawl v2, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

## Agent Resources

- [Complete Documentation](https://scrape-sdk-olive.vercel.app/llms-full.txt)
- [Skill](https://github.com/SoulSniper-V2/scrape-sdk/tree/main/skills/scrape-sdk): \`npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk\`
- [Source](https://github.com/SoulSniper-V2/scrape-sdk)

## Facts

- Package: scrape-sdk 0.2
- MCP: npx scrape-sdk-mcp (official MCP SDK)
- Tools: createTools() → web_fetch, web_search (map_site / crawl_site / extract_json when capable)
- Fetch default maxChars: 20000 (truncated + charCount)

## Quickstart

\`\`\`ts
import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";

const scraper = createScrapeClient({
  providers: [
    firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! }),
    jina(),
    local(),
  ],
});

await scraper.scrape("https://stripe.com", { format: "markdown" });
await scraper.search("firecrawl vs jina");
\`\`\`
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
