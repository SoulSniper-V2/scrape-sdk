import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrape SDK — The Unified Scraping API for AI Agents",
  description: "One TypeScript client for web scraping, crawling, and clean markdown extraction across Firecrawl, Jina, Tavily, and Local Cheerio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#0a0a0a] text-white">
      <body className="antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
