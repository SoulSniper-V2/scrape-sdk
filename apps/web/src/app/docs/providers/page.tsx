export default function ProvidersPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Supported Providers</h1>
        <p className="text-sm text-[#a09f97]">Standardized adapters across cloud and local engines.</p>
      </div>

      <div className="space-y-6">
        <div id="firecrawl" className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white text-base">Firecrawl</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c1a] text-[#8f8e87] border border-[#2b2b27]">Cloud (API Key)</span>
          </div>
          <p className="text-xs text-[#a09f97]">Best for complex Single Page Applications (SPAs) and dynamic JavaScript rendering.</p>
          <pre className="p-3 rounded bg-[#090908] font-mono text-xs text-[#dedcd4]">
            <code>import &#123; firecrawl &#125; from "scrape-sdk/firecrawl";</code>
          </pre>
        </div>

        <div id="jina" className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white text-base">Jina Reader</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c1a] text-emerald-400 border border-[#2b2b27]">Free / Optional Key</span>
          </div>
          <p className="text-xs text-[#a09f97]">High-speed direct markdown extraction via r.jina.ai. Sub-second response times.</p>
          <pre className="p-3 rounded bg-[#090908] font-mono text-xs text-[#dedcd4]">
            <code>import &#123; jina &#125; from "scrape-sdk/jina";</code>
          </pre>
        </div>

        <div id="tavily" className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white text-base">Tavily Extract</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c1a] text-[#8f8e87] border border-[#2b2b27]">Cloud (API Key)</span>
          </div>
          <p className="text-xs text-[#a09f97]">Optimized search & extraction tailored for autonomous LLM research pipelines.</p>
          <pre className="p-3 rounded bg-[#090908] font-mono text-xs text-[#dedcd4]">
            <code>import &#123; tavily &#125; from "scrape-sdk/tavily";</code>
          </pre>
        </div>

        <div id="local" className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white text-base">Local Cheerio</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c1a] text-emerald-400 border border-[#2b2b27]">100% Free / Offline</span>
          </div>
          <p className="text-xs text-[#a09f97]">Pure Node.js HTML sanitization and Turndown ATX markdown conversion. 0 tokens, 0 external API calls.</p>
          <pre className="p-3 rounded bg-[#090908] font-mono text-xs text-[#dedcd4]">
            <code>import &#123; local &#125; from "scrape-sdk/local";</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
