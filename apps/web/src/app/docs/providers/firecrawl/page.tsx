export default function ProviderPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white capitalize">firecrawl Adapter</h1>
        <p className="text-sm text-[#a09f97]">Standardized TypeScript adapter for firecrawl extraction.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Import</h3>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4]">
          <code>{`import { firecrawl } from "scrape-sdk/firecrawl";`}</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Example Usage</h3>
        <pre className="p-5 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85]">
          <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";

const scraper = createScrapeClient({
  provider: firecrawl(),
});

const result = await scraper.scrape("https://example.com");
console.log(result.markdown);`}</code>
        </pre>
      </div>
    </div>
  );
}
