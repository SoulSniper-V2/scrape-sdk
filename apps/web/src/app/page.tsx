'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Code2, 
  Copy, 
  Check, 
  ArrowRight, 
  ExternalLink, 
  Github, 
  Layers, 
  RefreshCw, 
  Cpu, 
  Globe, 
  ChevronRight,
  Workflow,
  ArrowUpRight,
  Database,
  Bot
} from 'lucide-react';

const PROVIDERS = [
  { id: 'firecrawl', name: 'Firecrawl', badge: 'Deep Crawl', desc: 'Full JavaScript rendering & dynamic SPA extraction', color: '#ff5c5c' },
  { id: 'jina', name: 'Jina Reader', badge: 'Zero Config', desc: 'High-speed markdown reader directly via r.jina.ai', color: '#38bdf8' },
  { id: 'tavily', name: 'Tavily', badge: 'Agent Search', desc: 'Optimized search & extract for autonomous LLMs', color: '#a855f7' },
  { id: 'spider', name: 'Spider', badge: 'High Speed', desc: 'Ultra-fast batch crawling for datasets', color: '#f59e0b' },
  { id: 'browserbase', name: 'Browserbase', badge: 'Headless Cloud', desc: 'Full cloud browser sessions with proxy rotation', color: '#ec4899' },
  { id: 'local', name: 'Local Cheerio', badge: 'Zero Token', desc: 'Offline HTML sanitization & Turndown markdown engine', color: '#10b981' },
];

const CODE_EXAMPLES = {
  quickstart: `import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

// Initialize with automatic multi-provider failover!
const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // Seamlessly fails over if primary hits 429 rate limits
});

const result = await scraper.scrape("https://stripe.com", {
  format: "markdown",
  onlyMainContent: true,
});

console.log(result.markdown);
console.log(\`Extracted via \${result.provider} in \${result.latencyMs}ms\`);`,

  ai: `import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { scrapeTool } from "scrape-sdk/ai";

const scraper = createScrapeClient({ provider: jina() });

// First-class Vercel AI SDK Tool definition
const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    scrape: scrapeTool(scraper),
  },
  prompt: "Summarize the top 3 stories on https://news.ycombinator.com",
});

console.log(text);`,

  mcp: `// Model Context Protocol (MCP) Server for Claude Code & Cursor
// Add to claude_desktop_config.json:
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"]
    }
  }
}

// Available tools in Claude / Cursor / Hermes:
// - scrape_web({ url: string, format?: "markdown" | "html" | "text" })`,

  cli: `# Instant CLI Extraction
npx scrape-sdk https://news.ycombinator.com

# Pipe clean web markdown into an LLM or clipboard
npx scrape-sdk https://stripe.com | pbcopy

# Extract raw JSON metadata & links
npx scrape-sdk https://github.com/trending --json`,
};

export default function Home() {
  const [url, setUrl] = useState('https://news.ycombinator.com');
  const [provider, setProvider] = useState('jina');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'ai' | 'mcp' | 'cli'>('quickstart');
  const [codeCopied, setCodeCopied] = useState(false);

  const handleScrape = async (targetUrl = url, targetProvider = provider) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, provider: targetProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract content');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during extraction');
    } finally {
      setLoading(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090908] text-[#f4f3ef] selection:bg-[#7ba2ff]/20 selection:text-[#7ba2ff] font-sans antialiased">
      {/* Background Subtle Radial Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(123,162,255,0.15),rgba(0,0,0,0))]" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090908]/85 border-b border-[#22221f]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7ba2ff] to-[#f4f3ef] flex items-center justify-center shadow-lg shadow-[#7ba2ff]/10">
              <Zap className="w-4 h-4 text-[#090908] fill-[#090908]" />
            </div>
            <span className="font-semibold tracking-tight text-white font-mono text-base">scrape-sdk</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#171715] text-[#a09f97] border border-[#2b2b27] font-mono">v0.1.3</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="https://www.npmjs.com/package/scrape-sdk" target="_blank" rel="noreferrer" className="text-[#a09f97] hover:text-white transition-colors">
              npm
            </a>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171715] border border-[#2b2b27] text-[#f4f3ef] hover:border-[#7ba2ff]/40 transition-all text-xs font-mono">
              <Github className="w-3.5 h-3.5" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171715] border border-[#2b2b27] text-xs text-[#a09f97]">
            <Sparkles className="w-3.5 h-3.5 text-[#7ba2ff]" />
            <span>The Unified Scraping & Markdown Engine for AI Agents</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
            Web scraping for agents, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7ba2ff] via-[#f4f3ef] to-[#a09f97]">handled.</span>
          </h1>

          <p className="text-lg text-[#a09f97] max-w-2xl mx-auto leading-relaxed">
            One clean TypeScript API for Firecrawl, Jina Reader, Tavily, Spider, Browserbase, and Local Cheerio with automatic failover, CLI, and MCP tooling.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => copyCommand('npm i scrape-sdk')}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#11110f] border border-[#2b2b27] hover:border-[#7ba2ff]/50 transition-all font-mono text-sm shadow-xl"
            >
              <span className="text-[#a09f97]">$</span>
              <span className="text-[#f4f3ef]">npm i scrape-sdk</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#a09f97] group-hover:text-white transition-colors" />}
            </button>
            <a
              href="https://github.com/SoulSniper-V2/scrape-sdk"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f4f3ef] text-[#090908] font-semibold text-sm hover:bg-white transition-all shadow-xl"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Hero Visual Artwork */}
        <div className="mt-12 relative rounded-2xl overflow-hidden border border-[#252522] bg-[#0c0c0b] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#090908] via-transparent to-transparent z-10 pointer-events-none" />
          <Image
            src="/hero-crawler.jpg"
            alt="Scrape SDK Architecture Engine"
            width={1200}
            height={675}
            priority
            className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#090908]/85 backdrop-blur-md p-4 rounded-xl border border-[#2b2b27]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-white">Multi-Provider Failover Matrix Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a09f97] font-mono">
              <span>Firecrawl</span> ➔ <span>Jina</span> ➔ <span>Local Cheerio</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Scraper Sandbox */}
        <section className="mt-20">
          <div className="rounded-2xl bg-[#11110f] border border-[#252522] shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#252522] bg-[#141412]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#7ba2ff]" />
                  <span>Interactive Extraction Playground</span>
                </h2>
                <p className="text-xs text-[#a09f97] mt-0.5">Test real-time markdown extraction directly in your browser</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#a09f97] font-medium mr-1">Presets:</span>
                {[
                  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
                  { label: 'Stripe Docs', url: 'https://stripe.com/docs' },
                  { label: 'GitHub Trending', url: 'https://github.com/trending' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setUrl(item.url);
                      handleScrape(item.url, provider);
                    }}
                    className="px-2.5 py-1 rounded bg-[#1c1c1a] border border-[#2b2b27] text-xs text-[#a09f97] hover:text-white hover:border-[#7ba2ff]/40 transition-all font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Controls */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#171715] border border-[#2b2b27] text-white text-sm focus:outline-none focus:border-[#7ba2ff] transition-all font-mono pl-9"
                  />
                  <Globe className="w-4 h-4 text-[#a09f97] absolute left-3 top-3" />
                </div>
                <div className="flex gap-2">
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-[#171715] border border-[#2b2b27] text-white text-sm focus:outline-none focus:border-[#7ba2ff] font-mono"
                  >
                    <option value="jina">Jina Reader (Cloud)</option>
                    <option value="local">Local Cheerio (Zero-Token)</option>
                  </select>
                  <button
                    onClick={() => handleScrape()}
                    disabled={loading || !url}
                    className="px-5 py-2.5 rounded-lg bg-[#7ba2ff] text-[#090908] font-semibold text-sm hover:bg-[#91b2ff] disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#7ba2ff]/10"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                    <span>Extract</span>
                  </button>
                </div>
              </div>

              {/* Output Preview */}
              {error && (
                <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono">
                  Error: {error}
                </div>
              )}

              {result && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-[#a09f97] font-mono px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-semibold">● 200 OK</span>
                      <span>Provider: <b className="text-white">{result.provider}</b></span>
                      <span>Latency: <b className="text-white">{result.latencyMs}ms</b></span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.markdown);
                        alert('Markdown copied to clipboard!');
                      }}
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Markdown
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-lg bg-[#0d0d0c] border border-[#22221f] p-4 text-xs font-mono text-[#d6d5ce] leading-relaxed whitespace-pre-wrap">
                    {result.markdown || 'No markdown extracted.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Architecture Flow Section */}
        <section className="mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">How It Works Under the Hood</h2>
            <p className="text-sm text-[#a09f97]">Your agent interacts with one unified contract. Scrape SDK manages providers and failover.</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#11110f] border border-[#252522] shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="p-5 rounded-xl bg-[#171715] border border-[#2b2b27] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#7ba2ff]/10 border border-[#7ba2ff]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#7ba2ff]" />
                </div>
                <h3 className="font-semibold text-white text-sm">Your AI Agent / App</h3>
                <p className="text-xs text-[#a09f97]">Calls <code>scrape(url)</code> via TypeScript, CLI, or Vercel AI SDK.</p>
              </div>

              <div className="p-5 rounded-xl bg-[#1a1a18] border border-[#7ba2ff]/40 space-y-2 relative shadow-lg shadow-[#7ba2ff]/5">
                <div className="w-8 h-8 rounded-lg bg-[#7ba2ff] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#090908] fill-[#090908]" />
                </div>
                <h3 className="font-semibold text-white text-sm">Scrape SDK Core</h3>
                <p className="text-xs text-[#a09f97]">Executes primary adapter with timeout & rate-limit auto-failover engine.</p>
              </div>

              <div className="p-5 rounded-xl bg-[#171715] border border-[#2b2b27] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <h3 className="font-semibold text-white text-sm">Pluggable Providers</h3>
                <p className="text-xs text-[#a09f97]">Firecrawl, Jina Reader, Tavily, Spider, Browserbase, or Local Cheerio.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Code & Integration Showcase */}
        <section className="mt-24 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">One API. Every Integration.</h2>
            <p className="text-sm text-[#a09f97]">Designed specifically for autonomous agents, LLM pipelines, and modern TypeScript workflows.</p>
          </div>

          <div className="rounded-2xl bg-[#11110f] border border-[#252522] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#252522] bg-[#141412] px-4">
              <div className="flex space-x-1">
                {[
                  { id: 'quickstart', label: 'TypeScript' },
                  { id: 'ai', label: 'Vercel AI SDK' },
                  { id: 'mcp', label: 'MCP Server' },
                  { id: 'cli', label: 'CLI & Shell' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-[#7ba2ff] text-white bg-[#1a1a18]'
                        : 'border-transparent text-[#a09f97] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-[#a09f97] hover:text-white transition-colors font-mono py-1 px-2.5 rounded bg-[#1c1c1a] border border-[#2b2b27]"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-6 bg-[#0d0d0c] overflow-x-auto">
              <pre className="text-xs font-mono text-[#d6d5ce] leading-relaxed whitespace-pre">
                <code>{CODE_EXAMPLES[activeTab]}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Supported Providers Matrix */}
        <section className="mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Supported Provider Adapters</h2>
            <p className="text-sm text-[#a09f97]">Switch adapters with one line of code without touching your business logic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="p-5 rounded-xl bg-[#11110f] border border-[#252522] hover:border-[#7ba2ff]/40 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-base group-hover:text-[#7ba2ff] transition-colors">{p.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1c1c1a] text-[#a09f97] border border-[#2b2b27]">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-[#a09f97] leading-relaxed">{p.desc}</p>
                <div className="pt-2 text-[11px] font-mono text-[#7ba2ff] flex items-center gap-1">
                  <code>scrape-sdk/{p.id}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-[#252522] flex flex-col sm:flex-row items-center justify-between text-xs text-[#a09f97] gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7ba2ff]" />
            <span className="font-mono text-white">scrape-sdk</span>
            <span>— Open source, MIT licensed</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://x.com/be_arsh" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Created by @be_arsh
            </a>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              npm
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
