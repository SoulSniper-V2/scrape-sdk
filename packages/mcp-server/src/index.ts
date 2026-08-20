#!/usr/bin/env node
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";
import { firecrawl } from "scrape-sdk/firecrawl";

const firecrawlKey = process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
const primary = firecrawlKey ? firecrawl({ apiKey: firecrawlKey }) : jina();

const client = createScrapeClient({
  provider: primary,
  fallback: local(),
});

process.stdin.setEncoding("utf-8");

let buffer = "";
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = await handleMcpRequest(request);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (err: any) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: err.message },
          id: null,
        }) + "\n"
      );
    }
  }
});

async function handleMcpRequest(req: any): Promise<any> {
  const { id, method, params } = req;

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "scrape_web",
            description: "Scrape any web page and extract clean markdown with automatic multi-provider fallback.",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", description: "The URL of the webpage to scrape" },
                format: { type: "string", enum: ["markdown", "html", "text"], default: "markdown" },
              },
              required: ["url"],
            },
          },
        ],
      },
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    if (name === "scrape_web") {
      const res = await client.scrape(args.url, { format: args.format || "markdown" });
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: res.markdown || res.text || res.html || "",
            },
          ],
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    result: {},
  };
}
