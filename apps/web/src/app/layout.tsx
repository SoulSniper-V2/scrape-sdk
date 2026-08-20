import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scrape SDK | Web scraping for agents, handled.',
  description: 'Add, crawl, extract, and convert web pages to clean markdown across Firecrawl, Jina, Tavily, and Local Cheerio with one TypeScript API.',
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
      </body>
    </html>
  );
}
