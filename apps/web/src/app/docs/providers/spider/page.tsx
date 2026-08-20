export default function ProviderPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white capitalize">spider Adapter</h1>
        <p className="text-sm text-[#a09f97]">Standardized TypeScript adapter for spider extraction.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Import</h3>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4]">
          <code>{`import { spider } from "scrape-sdk/spider";`}</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Example Usage</h3>
        <pre className="p-5 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85]">
          <code>{`import { createScrapeClient } from "scrape-sdk";
import { spider } from "scrape-sdk/spider";

const scraper = createScrapeClient({
  provider: spider(),
});

const result = await scraper.scrape("https://example.com");
console.log(result.markdown);`}</code>
        </pre>
      </div>
    </div>
  );
}
