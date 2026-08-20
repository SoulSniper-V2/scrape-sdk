import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ScrapeLogo } from '@/components/scrape-logo';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/installation', label: 'Installation & Skill' },
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/how-it-works', label: 'How It Works' },
    ],
  },
  {
    title: 'Providers',
    items: [
      { href: '/docs/providers', label: 'Provider Matrix' },
      { href: '/docs/providers/firecrawl', label: 'Firecrawl' },
      { href: '/docs/providers/jina', label: 'Jina Reader' },
      { href: '/docs/providers/tavily', label: 'Tavily Extract' },
      { href: '/docs/providers/spider', label: 'Spider.cloud' },
      { href: '/docs/providers/browserbase', label: 'Browserbase' },
      { href: '/docs/providers/local', label: 'Local Cheerio' },
    ],
  },
  {
    title: 'Concepts',
    items: [
      { href: '/docs/concepts/failover-matrix', label: 'Failover Matrix' },
      { href: '/docs/concepts/markdown-pipeline', label: 'Markdown Pipeline' },
      { href: '/docs/concepts/error-handling', label: 'Error Diagnostics' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { href: '/docs/guides/vercel-ai-sdk', label: 'Vercel AI SDK' },
      { href: '/docs/guides/model-context-protocol', label: 'Model Context Protocol (MCP)' },
      { href: '/docs/guides/offline-testing', label: 'Offline Testing' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { href: '/docs/api-reference/create-scrape-client', label: 'createScrapeClient' },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090908] text-[#f4f3ef] antialiased selection:bg-[#7ba2ff]/20 selection:text-[#7ba2ff]">
      <nav className="border-b border-[#252522] bg-[#090908]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1380px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ScrapeLogo className="w-7 h-7" />
            <span className="font-medium text-sm text-[#f4f3ef] tracking-tight">Scrape SDK Docs</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-[#999890]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-[1380px] mx-auto px-6 flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#252522] min-h-[calc(100vh-4rem)] py-8 pr-6 hidden md:block">
          <div className="space-y-8 text-xs font-mono">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-[#6f6e68] uppercase tracking-wider mb-2.5 text-[11px]">
                  {group.title}
                </h4>
                <ul className="space-y-1 text-[#a09f97]">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href} 
                        className="hover:text-white hover:bg-[#141412] px-2 py-1.5 rounded block transition-all"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Stage */}
        <main className="flex-1 py-12 md:pl-12 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
