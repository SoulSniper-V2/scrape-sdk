import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Copy } from 'lucide-react';

export default function DocsOverview() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="font-editorial text-5xl tracking-tight text-white">TypeScript Scrape SDK</h1>
        <p className="text-base text-[#a09f97] leading-relaxed">
          Scrape, crawl, and extract clean markdown across Firecrawl, Jina, Tavily, and Local Cheerio with one unified TypeScript API.
        </p>
      </div>

      <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
        <h3 className="font-semibold text-white text-sm">Install</h3>
        <pre className="p-4 rounded bg-[#090908] border border-[#22221f] font-mono text-xs text-[#d6d5ce]">
          <code>npm install scrape-sdk</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-editorial text-white">Quickstart Example</h2>
        <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
          <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

// Initialize with automatic failover!
const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // Shifts to Jina if primary rate-limits
});

const result = await scraper.scrape("https://stripe.com", {
  format: "markdown",
  onlyMainContent: true,
});

console.log(result.markdown);
console.log(\`Extracted via \${result.provider} in \${result.latencyMs}ms\`);`}</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-editorial text-white">Read Next</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/docs/installation" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Installation</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Package setup, exports, and environment variables.</p>
          </Link>
          <Link href="/docs/providers" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Compare Providers</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Firecrawl vs Jina vs Tavily vs Local Cheerio.</p>
          </Link>
          <Link href="/docs/ai-sdk" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">Vercel AI SDK</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Plug into generateText, streamText, and AI agents.</p>
          </Link>
          <Link href="/docs/mcp" className="p-5 rounded border border-[#2b2b27] bg-[#11110f] hover:border-[#7ba2ff]/40 transition-all">
            <h3 className="font-semibold text-white text-sm">MCP Server</h3>
            <p className="text-xs text-[#8f8e87] mt-1">Setup Model Context Protocol for Claude & Cursor.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
