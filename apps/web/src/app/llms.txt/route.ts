export const revalidate = false;

export function GET() {
  const content = `# Scrape SDK

> Scrape, crawl, and extract clean markdown across Firecrawl, Jina Reader, Tavily, Spider.cloud, Browserbase, and Local Cheerio with one unified TypeScript API and automatic failover.

## Agent Resources

- [Complete Documentation](https://web-three-lilac-53.vercel.app/llms-full.txt): All documentation in one file.
- [Install Scrape SDK Skill](https://github.com/SoulSniper-V2/scrape-sdk/tree/main/skills/scrape-sdk): \`npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk\`
- [Source Code](https://github.com/SoulSniper-V2/scrape-sdk): Package source, providers, tests, and examples.

## Product Facts

- Package: \`scrape-sdk\`
- License: MIT
- Runtime: Server-side Node.js 20+ or Bun
- Language: TypeScript
- Supported Providers: Firecrawl, Jina Reader, Tavily Extract, Spider.cloud, Browserbase, Local Cheerio
- Failover: Automatic secondary adapter execution upon HTTP 429 rate limits or timeouts

## Quickstart

\`\`\`ts
import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

export const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(),
});

const result = await scraper.scrape("https://stripe.com", {
  format: "markdown",
  onlyMainContent: true,
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
