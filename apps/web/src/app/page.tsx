'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  AlertCircle,
  Bot
} from 'lucide-react';
import { ScrapeLogo } from '@/components/scrape-logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const PROVIDERS = [
  { id: 'firecrawl', name: 'Firecrawl', href: '/docs/providers#firecrawl' },
  { id: 'jina', name: 'Jina Reader', href: '/docs/providers#jina' },
  { id: 'tavily', name: 'Tavily Extract', href: '/docs/providers#tavily' },
  { id: 'spider', name: 'Spider.cloud', href: '/docs/providers#spider' },
  { id: 'browserbase', name: 'Browserbase', href: '/docs/providers#browserbase' },
  { id: 'local', name: 'Local Cheerio', href: '/docs/providers#local' },
];

const CODE_EXAMPLES = {
  quickstart: `import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

// Initialize client with automatic failover
const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // shifts on 429 rate limit
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
  prompt: "Summarize top stories from https://news.ycombinator.com",
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
}`,

  skill: `# Install as an Agent Skill for Claude Code, Cursor, Codex, Hermes
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk

# Or paste this prompt into your agent:
Install the scrape-sdk skill for yourself:
Run: npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
If that command is not available, save https://scrape-sdk-olive.vercel.app/skills/scrape-sdk/SKILL.md into your skills directory as scrape-sdk/SKILL.md instead.
Then use scrape-sdk whenever you need to fetch, crawl, or extract clean markdown from any URL.`,

  cli: `# Instant CLI extraction
bunx scrape-sdk https://news.ycombinator.com

# Pipe clean web markdown into an LLM or clipboard
bunx scrape-sdk https://stripe.com | pbcopy`,
};

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [url, setUrl] = useState('https://news.ycombinator.com');
  const [provider, setProvider] = useState('jina');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [skillCopied, setSkillCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'skill' | 'ai' | 'mcp' | 'cli'>('quickstart');
  const [codeCopied, setCodeCopied] = useState(false);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 1. Hero load-in timeline
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.home-nav', { y: -20, opacity: 0, duration: 0.7 })
      .from('.hero-reveal', { y: 40, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.4')
      .from('.hero-art', { scale: 0.92, opacity: 0, y: 30, duration: 1.2 }, '-=0.6');

    // 2. Manifesto Word-by-Word Scroll Reveal
    const words = gsap.utils.toArray<HTMLElement>('.manifesto-word');
    if (words.length > 0) {
      gsap.set(words, { opacity: 0.18 });
      const wordTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.manifesto-section',
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.8,
        },
      });
      words.forEach((word, index) => {
        wordTimeline.to(word, { opacity: 1, duration: 0.15 }, index * 0.08);
      });
    }

    // 3. Architecture Visual Scale on Scroll
    gsap.fromTo(
      '.architecture-visual',
      { scale: 0.88, opacity: 0.35 },
      {
        scale: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.architecture-section',
          start: 'top 80%',
          end: 'center 50%',
          scrub: 1,
        },
      }
    );
  }, { scope: root });

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

    const copySkill = () => {
    navigator.clipboard.writeText('npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk');
    setSkillCopied(true);
    setTimeout(() => setSkillCopied(false), 2000);
  };

  const copyAgentPrompt = () => {
    const promptText = `Install the scrape-sdk skill for yourself:

Run: npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk

If that command is not available, save https://scrape-sdk-olive.vercel.app/skills/scrape-sdk/SKILL.md into your skills directory as scrape-sdk/SKILL.md instead.

Then use scrape-sdk whenever you need to fetch, crawl, or extract clean markdown from any URL.`;
    navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const manifestoText = "Scrape the URL. Return the exact markdown. Fallback before the agent fails.";

  return (
    <main ref={root} className="min-h-screen bg-[#090908] text-[#f4f3ef] antialiased selection:bg-[#7ba2ff]/20 selection:text-[#7ba2ff]">
      {/* Navigation */}
      <nav className="home-nav border-b border-[#252522] bg-[#090908]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ScrapeLogo className="w-8 h-8" />
            <span className="font-medium text-sm text-[#f4f3ef] tracking-tight">Scrape SDK</span>
          </Link>
          <div className="flex items-center gap-6 text-[13px] text-[#999890]">
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/docs/providers" className="hover:text-white transition-colors">
              Providers
            </Link>
            <Link href="/docs/installation" className="hover:text-white transition-colors">
              Installation
            </Link>
            <a href="https://github.com/SoulSniper-V2/scrape-sdk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
            <Link 
              href="/docs" 
              className="px-3.5 py-1.5 rounded border border-[#3b3b37] text-white hover:bg-[#f1efe8] hover:text-[#090908] transition-all font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-28 px-6 text-center max-w-[1240px] mx-auto overflow-hidden">
        <div className="relative z-10">
          <h1 className="hero-reveal font-editorial text-[clamp(3.8rem,8vw,8rem)] font-normal leading-[0.9] tracking-[-0.065em] text-[#f4f3ef] max-w-4xl mx-auto">
            <span>Web scraping,</span>
            <br />
            <span>handled.</span>
          </h1>

          <p className="hero-reveal mt-8 max-w-[620px] mx-auto text-[#aaa9a2] text-[clamp(1rem,1.4vw,1.18rem)] leading-[1.65] tracking-[-0.018em]">
            Add, crawl, extract, and convert web pages to clean markdown across all providers with one TypeScript API.
          </p>

          <div className="hero-reveal mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/installation"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded bg-[#f4f3ef] text-[#0a0a09] font-medium text-[13px] hover:translate-y-[-1px] transition-transform shadow-lg"
            >
              <span>Install Scrape SDK</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => copyCommand('bun add scrape-sdk')}
              className="inline-flex min-h-[48px] items-center justify-center gap-3 px-5 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-mono text-[12px] hover:translate-y-[-1px] transition-transform"
            >
              <span className="text-[#7ba2ff]">$</span>
              <code>bun add scrape-sdk</code>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#77766f]" />}
            </button>
          </div>

          <div className="hero-reveal mt-3 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={copySkill}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 px-4 rounded border border-[#2b2b27] bg-[#11110f]/80 backdrop-blur text-[#a09f97] hover:text-white hover:border-[#384c7a] font-mono text-[11.5px] transition-all"
            >
              <span className="text-[#7ba2ff]">npx skills add</span>
              <span className="text-[#dedcd4]">SoulSniper-V2/scrape-sdk</span>
              {skillCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#6f6e68]" />}
            </button>
            <button
              onClick={copyAgentPrompt}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 px-4 rounded border border-[#2b2b27] bg-[#11110f]/80 backdrop-blur text-[#d6d5ce] hover:text-white hover:border-[#7ba2ff]/50 text-[11.5px] font-medium transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-[#7ba2ff]" />
              <span>{promptCopied ? 'Copied Prompt to Clipboard!' : 'Copy Prompt for Agent'}</span>
              {promptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#6f6e68]" />}
            </button>
          </div>
        </div>

        {/* Hero Artwork Ribbon */}
        <div className="hero-art" aria-hidden="true">
          <Image
            src="/images/scrape-hero-ribbon.jpg"
            alt="Scrape SDK Hero Ribbon"
            width={1920}
            height={1080}
            priority
            unoptimized
          />
        </div>
      </section>

      {/* Provider Marquee */}
      <section className="border-y border-[#2b2b27] bg-[#090908] overflow-hidden py-0">
        <div className="animate-marquee">
          {[...PROVIDERS, ...PROVIDERS, ...PROVIDERS].map((p, idx) => (
            <Link key={`${p.id}-${idx}`} href={p.href} className="flex items-center gap-3 px-12 py-5 border-r border-[#2b2b27] text-[13px] font-medium text-[#c3c1b9] hover:bg-[#131311] hover:text-white transition-colors whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#7ba2ff]/60" />
              <span>{p.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Manifesto Section with Word-by-Word Scroll Scrub */}
      <section className="manifesto-section py-28 px-6 max-w-[1160px] mx-auto">
        <p className="font-editorial text-[clamp(2.6rem,5vw,4.8rem)] leading-[1.04] tracking-[-0.052em] text-[#f1efe8]">
          {manifestoText.split(' ').map((word, idx) => (
            <span key={idx} className="manifesto-word inline-block mr-[0.28em]">
              {word}
            </span>
          ))}
        </p>
      </section>

      {/* Bento Capability Grid */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-8">
            <h2 className="font-editorial text-[clamp(2.6rem,4.4vw,4.4rem)] leading-[0.98] tracking-[-0.055em] text-[#f4f3ef]">
              Everything your scraping flow needs. One API.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[#a09f97] text-[15px] leading-[1.7]">
              Scrape SDK keeps platform-specific APIs at the edge of your system and returns a clean markdown model your agent can consume directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#2b2b27] border border-[#2b2b27] overflow-hidden rounded">
          {/* Card 1: Code Window */}
          <div className="lg:col-span-7 bg-[#11110f] p-0 flex flex-col justify-between">
            <div className="h-12 border-b border-[#2b2b27] px-5 flex items-center justify-between text-xs font-mono text-[#6f6e68]">
              <span>scrape.ts</span>
              <span>TypeScript</span>
            </div>
            <pre className="p-8 font-mono text-[13px] leading-[1.85] text-[#dedcd4] overflow-x-auto">
              <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";

const scraper = createScrapeClient({
  provider: firecrawl({ apiKey: process.env.FIRECRAWL_KEY }),
  fallback: jina(), // shifts on 429 rate limits
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
                  ready
                </span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Primary (Firecrawl)</span>
                <span className="text-amber-400">429 Rate Limit</span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Failover Provider</span>
                <span className="text-[#7ba2ff]">Jina Reader</span>
              </div>
              <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                <span>Extracted Tokens</span>
                <span className="text-white font-semibold">1,840 tokens (124ms)</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-normal tracking-[-0.035em] text-[#eceae3]">Honest failover</h3>
              <p className="mt-2 text-sm text-[#8f8e87] leading-relaxed">
                If your primary provider rate-limits or times out, Scrape SDK shifts to fallback providers before your agent crashes.
              </p>
            </div>
          </div>

          {/* Card 3: Adapter Swap */}
          <div className="lg:col-span-4 bg-[#11110f] p-8 flex flex-col justify-between">
            <h3 className="text-xl font-normal tracking-[-0.035em] text-[#eceae3]">
              Change the adapter.<br />Keep the workflow.
            </h3>
            <div className="my-6 p-4 rounded bg-[#0d0d0c] border border-[#2b2b27] flex items-center justify-center gap-3 font-mono text-xs text-[#92b6ff]">
              <code>firecrawl()</code>
              <ArrowRight className="w-4 h-4 text-[#6f6e68]" />
              <code>jina()</code>
            </div>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Standardized options and responses across all 6 scraping providers.
            </p>
          </div>

          {/* Card 4: Clean Markdown Extraction */}
          <div className="lg:col-span-8 bg-[#11110f] p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-normal tracking-[-0.035em] text-[#eceae3]">Clean markdown your UI and agent can trust</h3>
              <Link href="/docs/providers" className="text-xs text-[#92b6ff] hover:underline flex items-center gap-1">
                Explore model <ArrowUpRight className="w-3 h-3" />
              </Link>
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

      {/* Architecture Diagram Section */}
      <section className="architecture-section max-w-[1240px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-editorial text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.98] tracking-[-0.05em] text-[#f4f3ef]">
              Your complete scraping workflow, already handled.
            </h2>
            <p className="text-[#a09f97] text-[15px] leading-relaxed">
              Your application owns agent logic and orchestration. Scrape SDK talks to configured providers. The provider remains the source of truth.
            </p>
            <Link href="/docs/providers" className="inline-flex items-center gap-1.5 text-xs text-[#92b6ff] hover:underline font-medium">
              Compare providers <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="architecture-visual lg:col-span-7 bg-[#11110f] border border-[#2b2b27] rounded p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-auto p-4 rounded bg-[#171715] border border-[#2b2b27] flex items-center gap-3">
                <Bot className="w-5 h-5 text-[#7ba2ff]" />
                <div>
                  <span className="text-xs font-semibold text-white block">Your application</span>
                  <span className="text-[11px] text-[#8f8e87]">agent rules + LLM prompt</span>
                </div>
              </div>

              <div className="hidden md:flex items-center text-[#6f6e68]">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="w-full md:w-auto p-4 rounded bg-[#171715] border border-[#7ba2ff]/40 shadow-lg shadow-[#7ba2ff]/5 flex items-center gap-3">
                <ScrapeLogo className="w-6 h-6" />
                <div>
                  <span className="text-xs font-semibold text-white block">Scrape SDK</span>
                  <span className="text-[11px] text-[#8f8e87]">one typed contract</span>
                </div>
              </div>

              <div className="hidden md:flex items-center text-[#6f6e68]">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="w-full md:w-auto flex flex-col gap-1.5">
                {['Firecrawl', 'Jina Reader', 'Tavily', 'Local'].map((name) => (
                  <div key={name} className="px-3 py-1.5 rounded bg-[#171715] border border-[#2b2b27] text-[11px] font-mono text-[#c3c1b9] flex items-center justify-between gap-3">
                    <span>{name}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#6f6e68]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle 4-Cards */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="mb-14">
          <h2 className="font-editorial text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[0.98] tracking-[-0.05em] text-[#f4f3ef]">
            Everything needed for the lifecycle. Nothing pretending to be magic.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded bg-[#11110f] border border-[#2b2b27] space-y-4">
            <span className="text-xs font-mono text-[#6f6e68] uppercase tracking-wider block">01 / Add</span>
            <div className="p-3 rounded bg-[#0d0d0c] border border-[#2b2b27] font-mono text-xs flex justify-between">
              <code>app.target.com</code>
              <span className="text-emerald-400">added</span>
            </div>
            <div>
              <h3 className="text-base font-normal text-white">Attach a URL</h3>
              <p className="text-xs text-[#8f8e87] mt-1 leading-relaxed">Validate once, pass custom headers, and safely execute across configured adapters.</p>
            </div>
          </div>

          <div className="p-6 rounded bg-[#11110f] border border-[#2b2b27] space-y-4">
            <span className="text-xs font-mono text-[#6f6e68] uppercase tracking-wider block">02 / Extract</span>
            <div className="p-3 rounded bg-[#0d0d0c] border border-[#2b2b27] font-mono text-xs flex justify-between">
              <b>MARKDOWN</b>
              <span className="text-[#7ba2ff]">clean ATX</span>
            </div>
            <div>
              <h3 className="text-base font-normal text-white">Return exact markdown</h3>
              <p className="text-xs text-[#8f8e87] mt-1 leading-relaxed">Strip navigation, styles, and boilerplate. Give your agent token-efficient text.</p>
            </div>
          </div>

          <div className="p-6 rounded bg-[#11110f] border border-[#2b2b27] space-y-4">
            <span className="text-xs font-mono text-[#6f6e68] uppercase tracking-wider block">03 / Failover</span>
            <div className="p-3 rounded bg-[#0d0d0c] border border-[#2b2b27] font-mono text-xs flex justify-between">
              <span>Primary 429</span>
              <span className="text-amber-400">➔ Fallback</span>
            </div>
            <div>
              <h3 className="text-base font-normal text-white">Auto-recover</h3>
              <p className="text-xs text-[#8f8e87] mt-1 leading-relaxed">Seamlessly route requests to backup providers if rate limits or timeouts occur.</p>
            </div>
          </div>

          <div className="p-6 rounded bg-[#11110f] border border-[#2b2b27] space-y-4">
            <span className="text-xs font-mono text-[#6f6e68] uppercase tracking-wider block">04 / Clean</span>
            <div className="p-3 rounded bg-[#0d0d0c] border border-[#2b2b27] font-mono text-xs flex justify-between">
              <code>Local fallback</code>
              <span className="text-emerald-400">0 tokens</span>
            </div>
            <div>
              <h3 className="text-base font-normal text-white">Zero token waste</h3>
              <p className="text-xs text-[#8f8e87] mt-1 leading-relaxed">Static Cheerio engine strips HTML clutter without consuming any external tokens.</p>
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
                { id: 'skill', label: 'Agent Skill' },
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

      {/* Closing CTA */}
      <section className="py-24 px-6 text-center border-t border-[#252522]">
        <p className="text-xs font-mono text-[#7ba2ff] uppercase tracking-wider mb-3">Add the URL. Show the markdown. Never fail.</p>
        <h2 className="font-editorial text-[clamp(2.8rem,5.5vw,5.5rem)] font-normal leading-[1.0] tracking-[-0.055em] text-[#f4f3ef] max-w-3xl mx-auto">
          Ship web scraping without rebuilding the workflow.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/installation"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded bg-[#f4f3ef] text-[#0a0a09] font-medium text-[13px] hover:translate-y-[-1px] transition-transform"
          >
            <span>Start building</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button
            onClick={copyAgentPrompt}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-medium text-[13px] hover:translate-y-[-1px] transition-transform"
          >
            <Terminal className="w-3.5 h-3.5 text-[#7ba2ff]" />
            <span>{promptCopied ? 'Copied Prompt!' : 'Copy Agent Prompt'}</span>
          </button>
          <a
            href="https://github.com/SoulSniper-V2/scrape-sdk"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-medium text-[13px] hover:translate-y-[-1px] transition-transform"
          >
            <Github className="w-4 h-4" />
            <span>View source</span>
          </a>
        </div>
        <p className="mt-5 text-xs text-[#8f8e87]">
          <a
            href="/skills/scrape-sdk/SKILL.md"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-white transition-colors"
          >
            Read raw SKILL.md first ↗
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#252522] py-12 px-6 max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#8f8e87] gap-4">
        <div className="flex items-center gap-2">
          <ScrapeLogo className="w-4 h-4" />
          <span>Scrape SDK</span>
          <span>— Open source, MIT licensed</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a href="/skills/scrape-sdk/SKILL.md" target="_blank" rel="noreferrer" className="hover:text-white transition-colors font-mono">
            SKILL.md
          </a>
          <Link href="/llms.txt" className="hover:text-white transition-colors font-mono">
            llms.txt
          </Link>
          <a href="https://x.com/be_arsh" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            @be_arsh
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
