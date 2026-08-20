import React from 'react';
import Link from 'next/link';
import { ScrapeLogo } from '@/components/scrape-logo';
import { ArrowUpRight } from 'lucide-react';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090908] text-[#f4f3ef] antialiased">
      <nav className="border-b border-[#252522] bg-[#090908]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-medium text-sm">
            <ScrapeLogo className="w-6 h-6" />
            <span>Scrape SDK Docs</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-[#999890]">
            <Link href="/" className="hover:text-white">Home</Link>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#252522] min-h-[calc(100vh-4rem)] py-8 pr-6 hidden md:block">
          <div className="space-y-8 text-xs font-mono">
            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Overview</h4>
              <ul className="space-y-2 text-[#8f8e87]">
                <li><Link href="/docs" className="hover:text-white block py-1">Quickstart</Link></li>
                <li><Link href="/docs/installation" className="hover:text-white block py-1">Installation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Providers</h4>
              <ul className="space-y-2 text-[#8f8e87]">
                <li><Link href="/docs/providers#firecrawl" className="hover:text-white block py-1">Firecrawl</Link></li>
                <li><Link href="/docs/providers#jina" className="hover:text-white block py-1">Jina Reader</Link></li>
                <li><Link href="/docs/providers#tavily" className="hover:text-white block py-1">Tavily Extract</Link></li>
                <li><Link href="/docs/providers#spider" className="hover:text-white block py-1">Spider.cloud</Link></li>
                <li><Link href="/docs/providers#browserbase" className="hover:text-white block py-1">Browserbase</Link></li>
                <li><Link href="/docs/providers#local" className="hover:text-white block py-1">Local Cheerio</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Integrations</h4>
              <ul className="space-y-2 text-[#8f8e87]">
                <li><Link href="/docs/ai-sdk" className="hover:text-white block py-1">Vercel AI SDK</Link></li>
                <li><Link href="/docs/mcp" className="hover:text-white block py-1">MCP Server</Link></li>
                <li><Link href="/docs/failover" className="hover:text-white block py-1">Auto-Failover</Link></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 py-12 md:pl-12 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
