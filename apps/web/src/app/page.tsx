'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  Copy, 
  Check, 
  ArrowRight, 
  Github, 
  Terminal, 
  Zap, 
  RefreshCw, 
  Layers, 
  Globe, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const PROVIDERS = [
  { id: 'firecrawl', name: 'Firecrawl', desc: 'Full JavaScript rendering & deep crawling' },
  { id: 'jina', name: 'Jina Reader', desc: 'Instant markdown extraction via r.jina.ai' },
  { id: 'tavily', name: 'Tavily Extract', desc: 'Agent search & raw content synthesis' },
  { id: 'spider', name: 'Spider.cloud', desc: 'Ultra-fast batch crawling engine' },
  { id: 'browserbase', name: 'Browserbase', desc: 'Headless cloud browser sessions' },
  { id: 'local', name: 'Local Cheerio', desc: 'Zero-token static HTML to markdown parser' },
];

const CODE_EXAMPLES = {
  quickstart: `import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

// Initialize client with automatic failover
const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // Shifts to Jina if primary rate-limits
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

// First-class Vercel AI SDK Tool
const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    scrape: scrapeTool(scraper),
  },
  prompt: "Summarize the key features from https://news.ycombinator.com",
});

console.log(text);`,

  mcp: `// Model Context Protocol (MCP) Server for Claude & Cursor
// Add to claude_desktop_config.json:
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"]
    }
  }
}

// Available tool:
// - scrape_web({ url: string, format?: "markdown" | "html" | "text" })`,

  cli: `# Instant CLI extraction
npx scrape-sdk https://news.ycombinator.com

# Pipe clean web markdown into an LLM or clipboard
npx scrape-sdk https://stripe.com | pbcopy

# Extract structured JSON
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
    <main className="min-h-screen bg-[#090908] text-[#f4f3ef] antialiased selection:bg-[#7ba2ff]/20 selection:text-[#7ba2ff]">
      {/* Navigation */}
      <nav className="border-b border-[#252522] bg-[#090908]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#171715] border border-[#2b2b27] flex items-center justify-center font-mono text-xs font-bold text-[#f1efe8]">
              ⚡
            </span>
            <span className="font-medium text-sm text-[#f4f3ef] tracking-tight">Scrape SDK</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#999890]">
            <a href="https://www.npmjs.com/package/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              npm v0.1.3
            </a>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href="https://github.com/SoulSniper-V2/scrape-sdk#quickstart" 
              target="_blank" 
              rel="noreferrer" 
              className="px-3.5 py-1.5 rounded border border-[#3b3b37] text-white hover:bg-[#f1efe8] hover:text-[#090908] transition-all font-medium"
            >
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section (OpenCore Editorial Typography) */}
      <section className="pt-24 pb-20 px-6 text-center max-w-[1240px] mx-auto">
        <h1 className="font-editorial text-[clamp(3.5rem,7.5vw,7.5rem)] font-normal leading-[0.92] tracking-[-0.06em] text-[#f4f3ef] max-w-4xl mx-auto">
          <span>Web scraping,</span>
          <br />
          <span>handled.</span>
        </h1>

        <p className="mt-8 max-w-[620px] mx-auto text-[#aaa9a2] text-[clamp(1rem,1.4vw,1.15rem)] leading-[1.65] tracking-[-0.015em]">
          Scrape, crawl, and extract clean markdown across Firecrawl, Jina, Tavily, and Local Cheerio with one TypeScript API.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/SoulSniper-V2/scrape-sdk"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded bg-[#f4f3ef] text-[#0a0a09] font-medium text-[13px] hover:translate-y-[-1px] transition-transform shadow-lg"
          >
            <span>Install Scrape SDK</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <button
            onClick={() => copyCommand('npm i scrape-sdk')}
            className="inline-flex min-h-[48px] items-center justify-center gap-3 px-5 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-mono text-[12px] hover:translate-y-[-1px] transition-transform"
          >
            <span className="text-[#7ba2ff]">$</span>
            <code>npm i scrape-sdk</code>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#77766f]" />}
          </button>
        </div>
      </section>

      {/* Provider Marquee */}
      <section className="border-y border-[#2b2b27] bg-[#090908] overflow-hidden py-0">
        <div className="animate-marquee">
          {[...PROVIDERS, ...PROVIDERS, ...PROVIDERS].map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="flex items-center gap-3 px-12 py-5 border-r border-[#2b2b27] text-[13px] font-medium text-[#c3c1b9] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#7ba2ff]/60" />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto Quote */}
      <section className="py-28 px-6 max-w-[1160px] mx-auto">
        <p className="font-editorial text-[clamp(2.5rem,4.8vw,4.6rem)] leading-[1.06] tracking-[-0.045em] text-[#f1efe8]">
          Scrape the URL. Extract the clean markdown. Fallback before failing.
        </p>
      </section>

      {/* Bento Capability Grid */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="mb-14">
          <h2 className="font-editorial text-[clamp(2.5rem,4.2vw,4.2rem)] leading-[1.0] tracking-[-0.05em] text-[#f4f3ef]">
            Everything your agent pipeline needs. One API.
          </h2>
          <p className="mt-4 text-[#a09f97] text-[15px] max-w-xl">
            Scrape SDK keeps provider-specific quirks at the edge and returns a normalized markdown model your LLM can read directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#2b2b27] border border-[#2b2b27] overflow-hidden rounded">
          {/* Card 1: Code Window */}
          <div className="lg:col-span-7 bg-[#11110f] p-0 flex flex-col justify-between">
            <div className="h-12 border-b border-[#2b2b27] px-5 flex items-center justify-between text-xs font-mono text-[#6f6e68]">
              <span>scrape.ts</span>
              <span>TypeScript</span>
            </div>
            <pre className="p-8 font-mono text-[13px] leading-[1.8] text-[#dedcd4] overflow-x-auto">
              <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // shifts on 429 rate limit
});

const result = await scraper.scrape("https://stripe.com", {
  format: "markdown",
  onlyMainContent: true,
});`}</code>
            </pre>
            <div className="p-6 border-t border-[#2b2b27] bg-[#141412]/40 text-xs text-[#8f8e87]">
              Zero boilerplate. Seamless provider failover.
            </div>
          </div>

          {/* Card 2: Status Ledger */}
          <div className="lg:col-span-5 bg-[#11110f] p-8 flex flex-col justify-between">
            <div className="border border-[#343430] bg-[#0d0d0c] divide-y divide-[#2c2c28] text-xs font-mono mb-8">
              <div className="p-4 flex items-center justify-between">
                <code className="text-[#dbd9d1]">stripe.com/pricing</code>
                <span className="text-[#b8d78e] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b8d78e]" />
                  200 OK
                </span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Primary (Firecrawl)</span>
                <span className="text-amber-400">429 Rate Limit</span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Failover Routing</span>
                <span className="text-[#7ba2ff]">Jina Reader</span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Parsed Tokens</span>
                <span className="text-white font-semibold">1,840 tokens (124ms)</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-normal tracking-[-0.03em] text-[#eceae3]">Honest failover</h3>
              <p className="mt-2 text-sm text-[#8f8e87] leading-relaxed">
                If your primary provider rate-limits or times out, Scrape SDK shifts to fallback providers before your agent crashes.
              </p>
            </div>
          </div>

          {/* Card 3: Adapter Swap */}
          <div className="lg:col-span-4 bg-[#11110f] p-8 flex flex-col justify-between">
            <h3 className="text-xl font-normal tracking-[-0.03em] text-[#eceae3]">
              Change the adapter.<br />Keep the workflow.
            </h3>
            <div className="my-6 p-4 rounded bg-[#0d0d0c] border border-[#2b2b27] flex items-center justify-center gap-3 font-mono text-xs text-[#92b6ff]">
              <code>firecrawl()</code>
              <ArrowRight className="w-4 h-4 text-[#6f6e68]" />
              <code>jina()</code>
            </div>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Standardized options across all 6 scraping providers.
            </p>
          </div>

          {/* Card 4: Clean Markdown Extraction */}
          <div className="lg:col-span-8 bg-[#11110f] p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-normal tracking-[-0.03em] text-[#eceae3]">Clean markdown your LLM can trust</h3>
            </div>
            <div className="space-y-2 border border-[#2b2b27] bg-[#0d0d0c] p-4 text-xs font-mono divide-y divide-[#1e1e1b]">
              <div className="pb-2 flex justify-between">
                <b className="text-[#7ba2ff]">MARKDOWN</b>
                <code className="text-[#dbd9d1]"># Stripe Payment Intents API</code>
                <span className="text-[#8f8e87]">clean ATX headers</span>
              </div>
              <div className="py-2 flex justify-between">
                <b className="text-[#a855f7]">METADATA</b>
                <code className="text-[#dbd9d1]">title, description, links</code>
                <span className="text-[#8f8e87]">structured</span>
              </div>
              <div className="pt-2 flex justify-between">
                <b className="text-emerald-400">ZERO BLOAT</b>
                <code className="text-[#dbd9d1]">scripts & styles stripped</code>
                <span className="text-[#8f8e87]">0 wasted tokens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-3xl font-normal tracking-tight text-[#f4f3ef]">Interactive Extraction Sandbox</h2>
            <p className="mt-1 text-sm text-[#8f8e87]">Test live extraction directly in the browser.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#6f6e68]">Presets:</span>
            {[
              { label: 'Hacker News', url: 'https://news.ycombinator.com' },
              { label: 'Stripe Docs', url: 'https://stripe.com/docs' },
              { label: 'GitHub', url: 'https://github.com/trending' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setUrl(p.url);
                  handleScrape(p.url, provider);
                }}
                className="px-2.5 py-1 rounded bg-[#171715] border border-[#2b2b27] text-[#aaa9a2] hover:text-white hover:border-[#7ba2ff]/50 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#2b2b27] bg-[#11110f] rounded overflow-hidden">
          <div className="p-4 border-b border-[#2b2b27] flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 rounded bg-[#0d0d0c] border border-[#2b2b27] text-white text-xs font-mono focus:outline-none focus:border-[#7ba2ff] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="px-3 py-2.5 rounded bg-[#0d0d0c] border border-[#2b2b27] text-white text-xs font-mono focus:outline-none focus:border-[#7ba2ff]"
              >
                <option value="jina">Jina Reader</option>
                <option value="local">Local Cheerio</option>
              </select>
              <button
                onClick={() => handleScrape()}
                disabled={loading || !url}
                className="px-5 py-2.5 rounded bg-[#f4f3ef] text-[#090908] font-medium text-xs hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Extract</span>}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border-b border-red-800/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#8f8e87] mb-2 px-1">
                <span>{result.provider} ➔ {result.latencyMs}ms</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.markdown);
                    alert('Markdown copied!');
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto rounded bg-[#0d0d0c] border border-[#22221f] p-4 text-xs font-mono text-[#d6d5ce] whitespace-pre-wrap">
                {result.markdown}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Integration Code Tabs */}
      <section className="max-w-[1240px] mx-auto px-6 pb-32">
        <div className="mb-8">
          <h2 className="font-editorial text-3xl font-normal tracking-tight text-[#f4f3ef]">Ready for agents & SDKs</h2>
        </div>

        <div className="border border-[#2b2b27] bg-[#11110f] rounded overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2b2b27] bg-[#0d0d0c] px-4">
            <div className="flex space-x-1">
              {[
                { id: 'quickstart', label: 'TypeScript' },
                { id: 'ai', label: 'Vercel AI SDK' },
                { id: 'mcp', label: 'MCP Server' },
                { id: 'cli', label: 'CLI' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-mono transition-all ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#7ba2ff] text-white'
                      : 'text-[#8f8e87] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={copyCode}
              className="text-xs text-[#8f8e87] hover:text-white font-mono flex items-center gap-1"
            >
              {codeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{codeCopied ? 'Copied' : 'Copy code'}</span>
            </button>
          </div>
          <pre className="p-6 bg-[#090908] text-xs font-mono text-[#dedcd4] leading-[1.8] overflow-x-auto">
            <code>{CODE_EXAMPLES[activeTab]}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#252522] py-12 px-6 max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#8f8e87] gap-4">
        <div className="flex items-center gap-2">
          <span>⚡ Scrape SDK</span>
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
  );
}
