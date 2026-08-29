'use client';

import React, { useState, useRef } from 'react';
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
  RefreshCw, 
  Bot,
} from 'lucide-react';
import { ScrapeLogo } from '@/components/scrape-logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const PROVIDERS = [
  { id: 'firecrawl', name: 'Firecrawl', href: '/docs/providers/firecrawl' },
  { id: 'tinyfish', name: 'TinyFish', href: '/docs/providers/tinyfish' },
  { id: 'jina', name: 'Jina Reader', href: '/docs/providers/jina' },
  { id: 'tavily', name: 'Tavily Extract', href: '/docs/providers/tavily' },
  { id: 'spider', name: 'Spider.cloud', href: '/docs/providers/spider' },
  { id: 'browserbase', name: 'Browserbase', href: '/docs/providers/browserbase' },
  { id: 'local', name: 'Local Cheerio', href: '/docs/providers/local' },
];

const CODE_EXAMPLES = {
  quickstart: `import { scrape } from "scrape-sdk";

const page = await scrape("https://stripe.com/docs");

console.log(page.markdown);
console.log(\`via \${page.provider} in \${page.latencyMs}ms\`);`,

  ai: `import { generateText, stepCountIs } from "ai";
import { fromEnv } from "scrape-sdk";
import { createTools } from "scrape-sdk/ai";

const scraper = fromEnv();

const { text } = await generateText({
  model: "openai/gpt-5.4",
  tools: createTools(scraper),
  stopWhen: stepCountIs(6),
  prompt: "Read https://news.ycombinator.com and summarize top discussions",
});

console.log(text);`,

  mcp: `// MCP configuration for Claude Desktop & Cursor
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"],
      "env": {
        "FIRECRAWL_KEYLESS": "1",
        "TINYFISH_API_KEY": "sk-tinyfish-...",
        "TAVILY_API_KEY": "tvly-..."
      }
    }
  }
}`,

  skill: `# Install as an Agent Skill for Claude Code, Cursor, Codex, Hermes
npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk

# Or paste this prompt into your agent:
Install the scrape-sdk skill for yourself:
Run: npx skills add SoulSniper-V2/scrape-sdk --skill scrape-sdk
If that command is not available, save https://www.scrape-sdk.com/skills/scrape-sdk/SKILL.md into your skills directory as scrape-sdk/SKILL.md instead.
Then use scrape-sdk whenever you need to fetch, crawl, or extract clean markdown from any URL.`,

  cli: `# Instant CLI extraction
bunx scrape-sdk https://news.ycombinator.com

# Pipe clean web markdown into an LLM or clipboard
bunx scrape-sdk https://stripe.com/pricing | pbcopy`,
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
      .from('.hero-art', { opacity: 0, y: 24, duration: 1.2 }, '-=0.6');

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

If that command is not available, save https://www.scrape-sdk.com/skills/scrape-sdk/SKILL.md into your skills directory as scrape-sdk/SKILL.md instead.

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

  const manifestoText = "Write one scrape call. Use the provider you have. Fail over quietly when an API goes down.";

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
      <section className="relative pt-24 pb-28 text-center overflow-hidden">
        <div className="relative z-10 px-6 max-w-[1240px] mx-auto">
          <h1 className="hero-reveal font-editorial text-[clamp(3.8rem,8vw,8rem)] font-normal leading-[0.9] tracking-[-0.065em] text-[#f4f3ef] max-w-4xl mx-auto">
            <span>Scrape the web.</span>
            <br />
            <span>Switch providers.</span>
          </h1>

          <p className="hero-reveal mt-8 max-w-[640px] mx-auto text-[#dedcd4] text-[clamp(1.05rem,1.45vw,1.22rem)] leading-[1.6] tracking-[-0.015em] font-normal">
            One TypeScript client to scrape, search, crawl, extract, and automate across 7 engines with automatic failover.
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
              className="inline-flex min-h-[48px] items-center justify-center gap-3 px-5 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-mono text-[12px] hover:translate-y-[-1px] transition-transform cursor-pointer"
            >
              <span className="text-[#7ba2ff]">$</span>
              <code>bun add scrape-sdk</code>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#77766f]" />}
            </button>
          </div>

          <div className="hero-reveal mt-3 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={copySkill}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 px-4 rounded border border-[#2b2b27] bg-[#11110f]/80 backdrop-blur text-[#a09f97] hover:text-white hover:border-[#384c7a] font-mono text-[11.5px] transition-all cursor-pointer"
            >
              <span className="text-[#7ba2ff]">npx skills add</span>
              <span className="text-[#dedcd4]">SoulSniper-V2/scrape-sdk</span>
              {skillCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#6f6e68]" />}
            </button>
            <button
              onClick={copyAgentPrompt}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 px-4 rounded border border-[#2b2b27] bg-[#11110f]/80 backdrop-blur text-[#d6d5ce] hover:text-white hover:border-[#7ba2ff]/50 text-[11.5px] font-medium transition-all cursor-pointer"
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
            src="/images/scrape-hero-ribbon.webp"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
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

      {/* Section 1: Core Code & Failover Pipeline (Side-by-Side) */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-8">
            <h2 className="font-editorial text-[clamp(2.6rem,4.4vw,4.4rem)] leading-[0.98] tracking-[-0.055em] text-[#f4f3ef]">
              Write one scrape call. Run it through any adapter.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[#a09f97] text-[15px] leading-[1.7]">
              Scrape SDK gives your application one typed client and one result shape across Firecrawl, TinyFish, Jina, Tavily, Spider, Browserbase, and local Cheerio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Code Window */}
          <div className="lg:col-span-7 rounded border border-[#2b2b27] bg-[#11110f] overflow-hidden flex flex-col justify-between">
            <div className="h-12 border-b border-[#2b2b27] px-5 flex items-center justify-between text-xs font-mono text-[#6f6e68]">
              <span>src/scraper.ts</span>
              <span>TypeScript</span>
            </div>
            <pre className="p-8 font-mono text-[13px] leading-[1.85] text-[#dedcd4] overflow-x-auto">
              <code>{`import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { tinyfish } from "scrape-sdk/tinyfish";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";

const scraper = createScrapeClient({
  providers: [
    firecrawl({}),
    tinyfish({ apiKey: process.env.TINYFISH_API_KEY! }),
    jina(),
    local(),
  ],
});

const page = await scraper.scrape("https://stripe.com/docs");
console.log(page.markdown);`}</code>
            </pre>
            <div className="p-5 border-t border-[#2b2b27] bg-[#141412]/40 text-xs text-[#8f8e87] flex items-center justify-between">
              <span>Automatic failover across providers</span>
              <span className="font-mono text-[#92b6ff]">strategy: &quot;priority&quot;</span>
            </div>
          </div>

          {/* Right: The Failover & Readability Outcome */}
          <div className="lg:col-span-5 rounded border border-[#2b2b27] bg-[#11110f] p-8 flex flex-col justify-between">
            <div>
              <div className="border border-[#343430] bg-[#0d0d0c] divide-y divide-[#2c2c28] text-xs font-mono mb-6">
                <div className="p-4 flex items-center justify-between">
                  <code className="text-[#dbd9d1]">stripe.com/pricing</code>
                  <span className="text-[#b8d78e] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#b8d78e]" />
                    rescued (200 OK)
                  </span>
                </div>
                <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                  <span>Primary (Firecrawl)</span>
                  <span className="text-amber-400">429 Rate Limit</span>
                </div>
                <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                  <span>Failover (Jina Reader)</span>
                  <span className="text-[#7ba2ff]">114ms</span>
                </div>
                <div className="p-3.5 px-4 flex items-center justify-between text-[#8f8e87]">
                  <span>DOM Noise Reduction</span>
                  <span className="text-white font-semibold">-96% (1,840 tokens)</span>
                </div>
              </div>

              <h3 className="text-xl font-normal tracking-[-0.035em] text-[#eceae3]">Silent circuit recovery</h3>
              <p className="mt-2 text-sm text-[#8f8e87] leading-relaxed">
                When a provider rate-limits or times out, Scrape SDK routes down your fallback list within a single deadline before throwing unhandled errors.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[#22221f] flex items-center gap-3 text-xs font-mono text-[#92b6ff]">
              <code>firecrawl()</code>
              <ArrowRight className="w-4 h-4 text-[#6f6e68]" />
              <code>jina()</code>
              <ArrowRight className="w-4 h-4 text-[#6f6e68]" />
              <code>local()</code>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 5 Unified Capabilities (Bespoke Scrape SDK Architecture) */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="mb-14">
          <h2 className="font-editorial text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[0.98] tracking-[-0.05em] text-[#f4f3ef]">
            Five unified capabilities. Zero boilerplate.
          </h2>
          <p className="mt-2 text-[#a09f97] text-[15px] max-w-2xl">
            One client handles individual pages, search discovery, multi-page crawling, sitemap indexing, and structured JSON Schema extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Op 1: Scrape */}
          <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#6f6e68]">
              <span className="text-white font-semibold">01 / scrape()</span>
              <code className="text-[#92b6ff]">URL ➔ Markdown</code>
            </div>
            <h3 className="text-base font-normal text-white">Clean Page Markdown</h3>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Converts web pages into clean ATX markdown, automatically stripping scripts, styles, navigation, and DOM bloat.
            </p>
            <div className="p-2.5 rounded bg-[#0d0d0c] border border-[#22221f] font-mono text-[11px] text-[#dbd9d1]">
              <code>await scraper.scrape(&quot;https://stripe.com&quot;)</code>
            </div>
          </div>

          {/* Op 2: Search */}
          <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#6f6e68]">
              <span className="text-white font-semibold">02 / search()</span>
              <code className="text-[#92b6ff]">Query ➔ Pages</code>
            </div>
            <h3 className="text-base font-normal text-white">Live Web Search</h3>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Searches the live web without a starting URL, querying real-time provider indexes (TinyFish, Tavily, Jina) in one call.
            </p>
            <div className="p-2.5 rounded bg-[#0d0d0c] border border-[#22221f] font-mono text-[11px] text-[#dbd9d1]">
              <code>await scraper.search(&quot;typescript web scraping&quot;)</code>
            </div>
          </div>

          {/* Op 3: Crawl */}
          <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#6f6e68]">
              <span className="text-white font-semibold">03 / crawl()</span>
              <code className="text-[#92b6ff]">Domain ➔ Corpus</code>
            </div>
            <h3 className="text-base font-normal text-white">Recursive Site Crawling</h3>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Traverses entire domains recursively, managing depth bounds, concurrency limits, and async job polling.
            </p>
            <div className="p-2.5 rounded bg-[#0d0d0c] border border-[#22221f] font-mono text-[11px] text-[#dbd9d1]">
              <code>await scraper.crawl(url, &#123; maxDepth: 2 &#125;)</code>
            </div>
          </div>

          {/* Op 4: Map */}
          <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#6f6e68]">
              <span className="text-white font-semibold">04 / map()</span>
              <code className="text-[#92b6ff]">Site ➔ URLs</code>
            </div>
            <h3 className="text-base font-normal text-white">Fast URL Discovery</h3>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Discovers all URLs on a site, indexing sitemaps and paths fast without downloading full HTML bodies.
            </p>
            <div className="p-2.5 rounded bg-[#0d0d0c] border border-[#22221f] font-mono text-[11px] text-[#dbd9d1]">
              <code>await scraper.map(url, &#123; limit: 100 &#125;)</code>
            </div>
          </div>

          {/* Op 5: Extract JSON */}
          <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between font-mono text-xs text-[#6f6e68]">
              <span className="text-white font-semibold">05 / extract()</span>
              <code className="text-[#92b6ff]">Page ➔ Structured JSON</code>
            </div>
            <h3 className="text-base font-normal text-white">Structured JSON Schema Extraction</h3>
            <p className="text-xs text-[#8f8e87] leading-relaxed">
              Extracts type-safe structured JSON, validating extracted page fields against your Zod or JSON Schema.
            </p>
            <div className="p-2.5 rounded bg-[#0d0d0c] border border-[#22221f] font-mono text-[11px] text-[#dbd9d1]">
              <code>await scraper.extract(url, &#123; schema: PricingSchema &#125;)</code>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Extraction Sandbox */}
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
                className="px-2.5 py-1 rounded bg-[#171715] border border-[#2b2b27] text-[#aaa9a2] hover:text-white hover:border-[#7ba2ff]/50 transition-all cursor-pointer"
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
                suppressHydrationWarning
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
                className="px-5 py-2.5 rounded bg-[#f4f3ef] text-[#090908] font-medium text-xs hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
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
                <span>
                  {result.provider} ➔ {result.latencyMs}ms
                  {result.failedOverFrom?.length
                    ? ` (${result.failedOverFrom.map((h: { provider: string; reason: string }) => `${h.provider} ${h.reason}`).join(" → ")})`
                    : ""}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.markdown);
                    alert('Markdown copied!');
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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

      {/* Section 4: Single-Vendor SDK vs Scrape SDK */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="mb-14">
          <h2 className="font-editorial text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.98] tracking-[-0.05em] text-[#f4f3ef]">
            Why developers switch from single-vendor SDKs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded border border-[#2b2b27] bg-[#11110f] space-y-5">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block font-semibold">
              Calling Vendor SDKs Directly
            </span>
            <ul className="space-y-3.5 text-xs text-[#a09f97] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-mono">✕</span>
                <span><b>Vendor Lock-in:</b> Rewriting callers whenever you swap or add a new scraping service.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-mono">✕</span>
                <span><b>Fragile Quotas:</b> Rate limits (429) or proxy outages immediately crash your backend.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-mono">✕</span>
                <span><b>CI / Offline Failures:</b> Local tests and CI pipelines require active cloud SaaS API keys.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded border border-[#3b4c7a] bg-[#11131a] space-y-5 shadow-lg shadow-[#7ba2ff]/5">
            <span className="text-xs font-mono text-[#92b6ff] uppercase tracking-wider block font-semibold">
              With Scrape SDK
            </span>
            <ul className="space-y-3.5 text-xs text-[#dedcd4] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono">✓</span>
                <span><b>One Typed Contract:</b> Same function calls and result shapes across all 7 backends.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono">✓</span>
                <span><b>Automatic Failover:</b> Seamlessly cascades down your fallback list within a single deadline.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono">✓</span>
                <span><b>Free Local Fallback:</b> Static Cheerio parser runs anywhere with zero API keys required.</span>
              </li>
            </ul>
          </div>
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
                  className={`px-4 py-3 text-xs font-mono transition-all cursor-pointer ${
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
              className="text-xs text-[#8f8e87] hover:text-white font-mono flex items-center gap-1 cursor-pointer"
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
        <p className="text-xs font-mono text-[#7ba2ff] uppercase tracking-wider mb-3">UNIFIED WEB EXTRACTION FOR TYPESCRIPT</p>
        <h2 className="font-editorial text-[clamp(2.8rem,5.5vw,5.5rem)] font-normal leading-[0.96] tracking-[-0.055em] text-[#f4f3ef] max-w-3xl mx-auto">
          Never let a rate limit
          <br />
          crash your backend.
        </h2>
        <p className="mt-6 text-[#a09f97] text-[15px] max-w-xl mx-auto leading-relaxed">
          Add Scrape SDK in seconds. Switch engines or layer fallbacks without rewriting a single line of application code.
        </p>
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
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 rounded border border-[#3b3b37] bg-[#11110f] text-[#d4d2cb] font-medium text-[13px] hover:translate-y-[-1px] transition-transform cursor-pointer"
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
