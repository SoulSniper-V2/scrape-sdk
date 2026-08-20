import Link from 'next/link';

export default function InstallationPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Installation</h1>
        <p className="text-sm text-[#a09f97]">Install the core TypeScript library or install it directly as an AI agent skill.</p>
      </div>

      {/* Skills CLI Section */}
      <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Install as an Agent Skill (Claude, Cursor, Codex)</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171715] text-[#7ba2ff] border border-[#2b2b27]">skills.sh</span>
        </div>
        <p className="text-xs text-[#8f8e87]">
          Equip your AI coding agent with the Scrape SDK skill instructions directly via the Skills CLI:
        </p>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4]">
          <code>npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk</code>
        </pre>
        <p className="text-[11px] text-[#6f6e68]">
          Add <code className="text-[#d6d5ce]">-g</code> to make the skill available globally across all of your workspace projects.
        </p>
      </div>

      {/* Package Managers */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Package Managers</h3>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#d6d5ce] leading-relaxed">
          <code>{`# bun (recommended)
bun add scrape-sdk

# npm
npm install scrape-sdk

# pnpm
pnpm add scrape-sdk`}</code>
        </pre>
      </div>

      {/* Subpath Exports */}
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
