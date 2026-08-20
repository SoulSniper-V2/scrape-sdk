export default function OfflineTestGuide() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Offline Testing</h1>
        <p className="text-sm text-[#a09f97]">Run test suites with 0 API keys and 0 network dependencies.</p>
      </div>

      <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
        <code>{`import { describe, it, expect } from "bun:test";
import { createScrapeClient } from "scrape-sdk";
import { local } from "scrape-sdk/local";

describe("Web scraper pipeline", () => {
  it("extracts clean markdown offline", async () => {
    const scraper = createScrapeClient({ provider: local() });
    const result = await scraper.scrape("https://example.com");
    
    expect(result.provider).toBe("local");
    expect(result.markdown).toContain("# Example Domain");
  });
});`}</code>
      </pre>
    </div>
  );
}
