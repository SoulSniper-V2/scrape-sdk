export default function HowItWorksPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">How It Works</h1>
        <p className="text-sm text-[#a09f97]">Under the hood: pipeline architecture, DOM sanitization, and AST conversion.</p>
      </div>

      <div className="space-y-4 text-sm text-[#a09f97] leading-relaxed">
        <p>
          Scrape SDK acts as a resilient buffer between your autonomous AI agents and edge scraping providers.
        </p>

        <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
          <h3 className="font-semibold text-white text-base">The 4-Stage Extraction Pipeline</h3>
          <ol className="list-decimal pl-5 space-y-2 text-xs font-mono text-[#d6d5ce]">
            <li><b>Validation & Normalization:</b> Validates target URL, applies standard headers, and sets execution deadline.</li>
            <li><b>Primary Execution:</b> Calls the configured adapter with timeout supervision.</li>
            <li><b>Automatic Failover:</b> If HTTP 429, 502, or timeout occurs, routes to secondary fallback provider before crashing.</li>
            <li><b>Token Cleaning & Formatting:</b> Strips JavaScript tags, CSS styles, navigation headers, and converts DOM into token-dense ATX markdown.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
