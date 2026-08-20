import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

async function scrapeUrl(url: string, provider = "jina") {
  const startTime = Date.now();

  if (provider === "local") {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ScrapeSDK/0.1",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, nav, footer, iframe, header").remove();
    const title = $("title").first().text().trim() || $("h1").first().text().trim() || "";
    const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
    turndown.remove(["script", "style", "noscript"]);
    const markdown = turndown.turndown($.html());

    return {
      url,
      title,
      markdown,
      provider: "local",
      latencyMs: Date.now() - startTime,
    };
  }

  // Default: Jina Reader API
  const targetUrl = `https://r.jina.ai/${encodeURI(url)}`;
  const res = await fetch(targetUrl, {
    headers: {
      Accept: "text/event-stream, application/json, text/plain",
    },
  });

  const markdown = await res.text();
  const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  return {
    url,
    title,
    markdown,
    provider: "jina",
    latencyMs: Date.now() - startTime,
  };
}

export async function POST(req: Request) {
  try {
    const { url, provider = "jina" } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await scrapeUrl(url, provider);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
