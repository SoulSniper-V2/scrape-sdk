export default function ApiReferencePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">createScrapeClient(config)</h1>
        <p className="text-sm text-[#a09f97]">Factory function to create a typed, resilient ScrapeClient instance.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Type Signature</h3>
        <pre className="p-5 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85]">
          <code>{`export interface ScrapeClientConfig {
  provider: ScrapeProvider;
  fallback?: ScrapeProvider;
  defaultFormat?: "markdown" | "html" | "text" | "json";
  timeoutMs?: number;
}

export function createScrapeClient(config: ScrapeClientConfig): ScrapeClient;`}</code>
        </pre>
      </div>
    </div>
  );
}
