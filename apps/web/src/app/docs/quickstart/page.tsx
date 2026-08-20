export default function QuickstartPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Quickstart</h1>
        <p className="text-sm text-[#a09f97]">Get up and running with Scrape SDK in less than 2 minutes.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white">1. Install Package</h3>
          <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4]">
            <code>bun add scrape-sdk</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white">2. Create Client</h3>
          <pre className="p-5 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85]">
            <code>{`import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";

const scraper = createScrapeClient({
  provider: jina(), // Zero-config instant markdown
});

const result = await scraper.scrape("https://news.ycombinator.com");
console.log(result.markdown);`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
