export default function AiSdkPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Vercel AI SDK Integration</h1>
        <p className="text-sm text-[#a09f97]">Tools use inputSchema. createTools() exposes web_fetch and web_search; map/crawl/extract appear when the client can do them.</p>
      </div>

      <pre className="p-6 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] leading-[1.85] overflow-x-auto">
        <code>{`import { generateText, stepCountIs } from "ai";
import { fromEnv } from "scrape-sdk";
import { createTools } from "scrape-sdk/ai";

const scraper = fromEnv();

const { text } = await generateText({
  model: "openai/gpt-5.4",
  tools: createTools(scraper),
  stopWhen: stepCountIs(6),
  prompt: "What are the latest updates on https://news.ycombinator.com?",
});`}</code>
      </pre>
    </div>
  );
}
