"use client";

import React, { useState } from "react";
import { Terminal, Shield, Zap, Copy, Check, ExternalLink, ArrowRight, Code2, Globe } from "lucide-react";

export default function HomePage() {
  const [url, setUrl] = useState("https://news.ycombinator.com");
  const [provider, setProvider] = useState("jina");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"markdown" | "preview" | "code">("markdown");

  const handleScrape = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            ⚡
          </div>
          <span className="font-mono text-lg font-semibold tracking-tight">scrape-sdk</span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/arushwadhawan/scrape-sdk"
            target="_blank"
            className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://x.com/be_arsh"
            target="_blank"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
          >
            @be_arsh
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-6">
          <span>v0.1.0</span>
          <span>•</span>
          <span>Unified Scraping Primitive for AI Agents</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Web scraping & markdown extraction, handled.
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed mb-8">
          One unified TypeScript client across Firecrawl, Jina, Tavily, Spider, and Local Cheerio. With automatic multi-provider failover when your primary hits 429 limits.
        </p>

        {/* Quick Install Banner */}
        <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 font-mono text-sm">
          <span className="text-zinc-500">$</span>
          <span className="text-zinc-200">npm install scrape-sdk</span>
          <button
            onClick={() => copyCode("npm install scrape-sdk")}
            className="text-zinc-500 hover:text-white transition ml-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Sandbox Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-xl mb-16">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Globe className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter any URL (e.g. https://stripe.com)"
              className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 font-mono text-sm focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="jina">Jina Reader (Free)</option>
            <option value="local">Local Cheerio (Zero-Token)</option>
            <option value="firecrawl">Firecrawl Adapter</option>
            <option value="tavily">Tavily Extract</option>
          </select>
          <button
            onClick={handleScrape}
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <span>Scraping...</span> : <><span>Extract</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Sandbox Output Tabs */}
        {result && (
          <div className="mt-6 border-t border-zinc-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("markdown")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${activeTab === "markdown" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${activeTab === "preview" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Rendered
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${activeTab === "code" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Code Snippet
                </button>
              </div>
              <div className="text-xs font-mono text-emerald-400 flex items-center space-x-3">
                <span>{result.provider}</span>
                <span>•</span>
                <span>{result.latencyMs}ms</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 font-mono text-xs text-zinc-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {activeTab === "markdown" && (result.markdown || result.text || "No content")}
              {activeTab === "preview" && (
                <div className="prose prose-invert max-w-none text-zinc-300 font-sans">
                  <h3 className="text-lg font-bold text-white mb-2">{result.title}</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.html || result.markdown }} />
                </div>
              )}
              {activeTab === "code" && (
                `import { createScrapeClient } from "scrape-sdk";
import { ${result.provider} } from "scrape-sdk/${result.provider}";

const scraper = createScrapeClient({
  provider: ${result.provider}(),
});

const page = await scraper.scrape("${url}");
console.log(page.markdown);`
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <Shield className="w-6 h-6 text-emerald-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">Automatic Failover</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            If Firecrawl hits 429 rate limits or timeouts, your agent automatically falls back to Jina or Local Cheerio.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <Zap className="w-6 h-6 text-emerald-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">Agent & MCP First</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Plug straight into Vercel AI SDK (<code>scrapeTool</code>) or launch a standard MCP server for Claude Code and Cursor.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <Terminal className="w-6 h-6 text-emerald-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">1-Line CLI</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Run <code>npx scrape-sdk &lt;url&gt;</code> to pipe clean markdown directly into terminal agents or clipboard.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/80 pt-8 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <div>MIT License • Built by Arush Wadhawan</div>
        <div className="flex space-x-4">
          <a href="https://x.com/be_arsh" target="_blank" className="hover:text-zinc-300">@be_arsh</a>
          <a href="https://github.com/arushwadhawan/scrape-sdk" target="_blank" className="hover:text-zinc-300">GitHub</a>
        </div>
      </div>
    </div>
  );
}
