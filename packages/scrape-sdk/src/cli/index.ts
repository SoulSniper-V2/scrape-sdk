#!/usr/bin/env node
import { createScrapeClient } from "../index.js";
import { jina } from "../adapters/jina.js";
import { local } from "../adapters/local.js";
import { firecrawl } from "../adapters/firecrawl.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
⚡ Scrape SDK CLI

Usage:
  npx scrape-sdk <url> [options]

Options:
  --format <markdown|html|text>  Output format (default: markdown)
  --provider <jina|local|firecrawl>  Specify provider (default: jina with local failover)
  --json                         Output entire result as JSON
  --help, -h                     Show this help message

Examples:
  npx scrape-sdk https://stripe.com
  npx scrape-sdk https://news.ycombinator.com --format text
  npx scrape-sdk https://github.com/trending --json
`);
    process.exit(0);
  }

  const url = args.find((a) => a.startsWith("http://") || a.startsWith("https://"));
  if (!url) {
    console.error("Error: Please provide a valid URL.");
    process.exit(1);
  }

  const formatIdx = args.indexOf("--format");
  const format = formatIdx !== -1 ? (args[formatIdx + 1] as any) : "markdown";

  const isJson = args.includes("--json");

  const firecrawlKey = process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
  const primary = firecrawlKey ? firecrawl({ apiKey: firecrawlKey }) : jina();

  const client = createScrapeClient({
    provider: primary,
    fallback: local(),
  });

  try {
    const result = await client.scrape(url, { format, onlyMainContent: true });

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.markdown || result.text || result.html);
    }
  } catch (err: any) {
    console.error(`Scrape failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
