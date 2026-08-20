export default function ErrorHandlingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Error Diagnostics</h1>
        <p className="text-sm text-[#a09f97]">Structured ScrapeError classes with retryable diagnostics.</p>
      </div>

      <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
        <code>{`import { ScrapeError } from "scrape-sdk";

try {
  const result = await scraper.scrape("https://example.com");
} catch (error) {
  if (error instanceof ScrapeError) {
    console.error(error.code);      // "RATE_LIMITED" | "TIMEOUT" | "INVALID_URL"
    console.error(error.retryable); // true | false
    console.error(error.provider);  // "firecrawl"
  }
}`}</code>
      </pre>
    </div>
  );
}
