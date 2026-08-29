#!/usr/bin/env node
import { createScrapeClient } from "../index.js";
import { fromEnv } from "../from-env.js";
import { ScrapeClient } from "../client.js";
import { jina } from "../adapters/jina.js";
import { local } from "../adapters/local.js";
import { firecrawl } from "../adapters/firecrawl.js";
import { tavily } from "../adapters/tavily.js";
import { spider } from "../adapters/spider.js";
import { browserbase } from "../adapters/browserbase.js";
import { tinyfish } from "../adapters/tinyfish.js";
import { viaLine } from "../via.js";

function help(): void {
  console.log(`
scrape-sdk — scrape a URL to markdown (real page, not a summary)

Usage:
  npx scrape-sdk <url>
  npx scrape-sdk scrape <url> [--format markdown|html|text] [--json] [--provider jina|local|firecrawl|tinyfish|tavily|spider|browserbase]
  npx scrape-sdk search <query> [--json]
  npx scrape-sdk crawl <url> [--limit 10] [--json]
  npx scrape-sdk map <url> [--limit 100] [--json]
  npx scrape-sdk agent <url> <goal...> [--provider tinyfish] [--json]
  npx scrape-sdk mcp

Works with no keys (Jina + local). Optional:
  FIRECRAWL_API_KEY (or FIRECRAWL_KEYLESS=1), TINYFISH_API_KEY, TAVILY_API_KEY,
  JINA_API_KEY, SPIDER_API_KEY, BROWSERBASE_API_KEY
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    help();
    process.exit(0);
  }

  if (args[0] === "mcp") {
    console.error("Start the MCP server with: npx scrape-sdk-mcp");
    process.exit(1);
  }

  const command = ["scrape", "search", "crawl", "map", "agent"].includes(args[0]) ? args[0] : "scrape";
  const rest = command === args[0] ? args.slice(1) : args;
  const jsonOut = rest.includes("--json");
  const client = buildClient(rest);

  try {
    if (command === "search") {
      const query = searchQuery(rest);
      if (!query) throw new Error("Provide a search query");
      const result = await client.search(query);
      if (!jsonOut) console.error(viaLine(result));
      print(jsonOut ? result : result.results.map((r) => `- ${r.title}\n  ${r.url}\n  ${r.snippet}`).join("\n\n") || "No results");
      return;
    }

    if (command === "agent") {
      const url = rest.find((a) => a.startsWith("http://") || a.startsWith("https://"));
      const goal = agentGoal(rest);
      if (!url) throw new Error("Provide a valid http(s) URL");
      if (!goal) throw new Error("Provide an agent goal after the URL");
      const result = await client.agent(url, { goal });
      if (!jsonOut) console.error(viaLine(result));
      print(jsonOut ? result : JSON.stringify(result.data ?? {}, null, 2));
      return;
    }

    const url = rest.find((a) => a.startsWith("http://") || a.startsWith("https://"));
    if (!url) throw new Error("Provide a valid http(s) URL");

    if (command === "map") {
      const limitIdx = rest.indexOf("--limit");
      const limit = limitIdx !== -1 ? Number(rest[limitIdx + 1]) : 100;
      const result = await client.map(url, { limit });
      if (!jsonOut) console.error(viaLine(result));
      print(jsonOut ? result : result.links.join("\n") || "No links");
      return;
    }

    if (command === "crawl") {
      const limitIdx = rest.indexOf("--limit");
      const limit = limitIdx !== -1 ? Number(rest[limitIdx + 1]) : 10;
      const result = await client.crawl(url, { limit });
      if (!jsonOut) console.error(viaLine(result));
      print(jsonOut ? result : result.pages.map((p) => `# ${p.title}\n${p.url}\n\n${p.markdown}`).join("\n\n---\n\n"));
      return;
    }

    const formatIdx = rest.indexOf("--format");
    const format = formatIdx !== -1 ? rest[formatIdx + 1] : "markdown";
    if (format !== "markdown" && format !== "html" && format !== "text") {
      throw new Error("--format must be markdown, html, or text");
    }
    const result = await client.scrape(url, { format, onlyMainContent: true });
    if (!jsonOut) console.error(viaLine(result));
    print(jsonOut ? result : selectedContent(result, format));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`scrape-sdk: ${message}`);
    process.exit(1);
  }
}

function buildClient(args: string[]): ScrapeClient {
  const providerIdx = args.indexOf("--provider");
  const named = providerIdx !== -1 ? args[providerIdx + 1] : undefined;
  if (!named) return fromEnv({ cache: false });

  if (named === "local") return createScrapeClient({ provider: local() });
  if (named === "jina") return createScrapeClient({ provider: jina({ apiKey: process.env.JINA_API_KEY }), fallback: local() });
  if (named === "firecrawl") {
    const key = process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_KEY;
    return createScrapeClient({
      provider: firecrawl(key ? { apiKey: key } : {}),
      fallback: [jina(), local()],
    });
  }
  if (named === "tinyfish") {
    const key = process.env.TINYFISH_API_KEY;
    if (!key) throw new Error("TINYFISH_API_KEY is required for --provider tinyfish");
    return createScrapeClient({
      provider: tinyfish({ apiKey: key, enableAgent: process.env.TINYFISH_AGENT === "1" }),
      fallback: [jina(), local()],
    });
  }
  if (named === "tavily") {
    const key = process.env.TAVILY_API_KEY;
    if (!key) throw new Error("TAVILY_API_KEY is required for --provider tavily");
    return createScrapeClient({ provider: tavily({ apiKey: key }), fallback: [jina(), local()] });
  }
  if (named === "spider") {
    const key = process.env.SPIDER_API_KEY || process.env.SPIDER_KEY;
    if (!key) throw new Error("SPIDER_API_KEY is required for --provider spider");
    return createScrapeClient({ provider: spider({ apiKey: key }), fallback: [jina(), local()] });
  }
  if (named === "browserbase") {
    const key = process.env.BROWSERBASE_API_KEY;
    if (!key) throw new Error("BROWSERBASE_API_KEY is required for --provider browserbase");
    return createScrapeClient({ provider: browserbase({ apiKey: key }), fallback: [jina(), local()] });
  }
  throw new Error(`Unknown provider: ${named}`);
}

function searchQuery(args: string[]): string {
  const values: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--json") continue;
    if (arg === "--provider" || arg === "--format" || arg === "--limit") {
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) values.push(arg);
  }
  return values.join(" ").trim();
}

function agentGoal(args: string[]): string {
  const values: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--json" || arg.startsWith("http://") || arg.startsWith("https://")) continue;
    if (arg === "--provider" || arg === "--format" || arg === "--limit") {
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) values.push(arg);
  }
  return values.join(" ").trim();
}

function selectedContent(
  result: { markdown: string; text?: string; html?: string },
  format: "markdown" | "html" | "text"
): string {
  const content = format === "html" ? result.html : format === "text" ? result.text : result.markdown;
  if (content === undefined) {
    throw new Error(`Provider did not return ${format} content`);
  }
  return content;
}

function print(value: unknown): void {
  if (typeof value === "string") console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
