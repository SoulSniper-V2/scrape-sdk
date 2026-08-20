import Link from 'next/link';

export default function InstallationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Installation</h1>
        <p className="text-sm text-[#a09f97]">Install the core TypeScript library in your package manager.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Package Managers</h3>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#d6d5ce] leading-relaxed">
          <code>{`# npm
npm install scrape-sdk

# pnpm
pnpm add scrape-sdk

# bun
bun add scrape-sdk`}</code>
        </pre>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Supported Subpath Exports</h3>
        <div className="p-4 rounded border border-[#2b2b27] bg-[#11110f] space-y-2 font-mono text-xs">
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk</span>
            <span className="text-[#8f8e87]">Core ScrapeClient engine</span>
          </div>
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk/firecrawl</span>
            <span className="text-[#8f8e87]">Firecrawl v1 adapter</span>
          </div>
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk/jina</span>
            <span className="text-[#8f8e87]">Jina Reader adapter</span>
          </div>
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk/tavily</span>
            <span className="text-[#8f8e87]">Tavily Extract adapter</span>
          </div>
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk/local</span>
            <span className="text-[#8f8e87]">Zero-token Cheerio parser</span>
          </div>
          <div className="flex justify-between text-[#d6d5ce]">
            <span>scrape-sdk/ai</span>
            <span className="text-[#8f8e87]">Vercel AI SDK scrapeTool</span>
          </div>
        </div>
      </div>
    </div>
  );
}
