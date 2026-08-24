import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Provider } from '@/components/provider';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Scrape SDK - Unified web scraping for TypeScript',
  description: 'An open-source TypeScript SDK for unified web scraping and markdown extraction across Firecrawl, Jina, Tavily, Spider, Browserbase, and Local Cheerio. 6 engines. One typed client.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#090908] text-[#f4f3ef] antialiased">
        <Provider>{children}</Provider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
