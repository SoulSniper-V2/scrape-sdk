import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { ScrapeLogo } from '@/components/scrape-logo';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="domain-docs-shell">
      <DocsLayout
        tree={source.getPageTree()}
        nav={{
          title: (
            <span className="flex items-center gap-2.5 font-semibold text-sm text-[#f4f3ef]">
              <ScrapeLogo className="w-6 h-6" />
              <span>Scrape SDK</span>
            </span>
          ),
          url: '/',
        }}
        sidebar={{
          defaultOpenLevel: 2,
        }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
