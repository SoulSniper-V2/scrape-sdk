import Link from 'next/link';

export default function DocsOverview() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="font-editorial text-5xl tracking-tight text-white">TypeScript Scrape SDK</h1>
        <p className="text-base text-[#a09f97] leading-relaxed">
          Scrape, crawl, and extract clean markdown across Firecrawl, Jina Reader, Tavily, Spider.cloud, Browserbase, and Local Cheerio with one unified TypeScript API.
        </p>
      </div>

      <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
        <h3 className="font-semibold text-white text-sm">Quick Install</h3>
        <pre className="p-4 rounded bg-[#090908] border border-[#22221f] font-mono text-xs text-[#d6d5ce]">
          <code>bun add scrape-sdk</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-editorial text-white">Core Example</h2>
        <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
          <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

// Initialize client with automatic rate-limit failover
export const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // shifts to Jina if primary hits HTTP 429
});

const result = await scraper.scrape("https://stripe.com/docs", {
  format: "markdown",
  onlyMainContent: true,
});

console.log(result.markdown);`}</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-editorial text-white">Read Next</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/docs/installation" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Installation & Skills</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Package setup, Skills CLI, and subpath exports.</p>
          </Link>
          <Link href="/docs/how-it-works" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">How It Works</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Extraction pipeline, token sanitization, and AST conversion.</p>
          </Link>
          <Link href="/docs/providers" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Provider Matrix</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Compare Firecrawl vs Jina vs Tavily vs Local Cheerio.</p>
          </Link>
          <Link href="/docs/concepts/failover-matrix" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Failover Matrix</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Automatic recovery on timeouts and HTTP 429 rate limits.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
