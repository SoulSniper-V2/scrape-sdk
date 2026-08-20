export default function VercelAiGuide() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Vercel AI SDK Tooling</h1>
        <p className="text-sm text-[#a09f97]">Equip LLM agents with autonomous web extraction tools.</p>
      </div>

      <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
        <code>{`import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { scrapeTool } from "scrape-sdk/ai";

const scraper = createScrapeClient({ provider: jina() });

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    scrape: scrapeTool(scraper),
  },
  prompt: "What are the latest updates on https://news.ycombinator.com?",
});

console.log(text);`}</code>
      </pre>
    </div>
  );
}
