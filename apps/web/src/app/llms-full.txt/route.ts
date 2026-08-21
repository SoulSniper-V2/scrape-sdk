export const revalidate = false;

export function GET() {
  const content = `# Scrape SDK

TypeScript web client: scrape, search, crawl, extract.

Install: npm install scrape-sdk

\`\`\`ts
import { createScrapeClient, fromEnv } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";
import { createTools } from "scrape-sdk/ai";

const scraper = createScrapeClient({
  providers: [
    firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! }),
    jina(),
    local(),
  ],
});

await scraper.scrape("https://example.com");
await scraper.search("query");
await scraper.crawl("https://docs.example.com", { limit: 10 });
await scraper.extract("https://example.com", { schema: { type: "object", properties: { title: { type: "string" } } } });
\`\`\`

Adapters talk to real APIs:
- Firecrawl v2 scrape/search/map/crawl (poll GET /crawl/{id})
- Jina r.jina.ai JSON + s.jina.ai search
- Tavily Bearer /extract and /search
- Spider /scrape and /crawl
- Browserbase POST /v1/fetch (not a browser session)
- Local cheerio+turndown

MCP: npx -y scrape-sdk-mcp
Tools: web_fetch, web_search, map_site, crawl_site, extract_json
web_fetch defaults to 20000 chars and returns truncated + charCount
AI: createTools(scraper) uses inputSchema
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
