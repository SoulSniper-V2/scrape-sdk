import { NextResponse } from "next/server";
import { createScrapeClient } from "scrape-sdk";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";

export async function POST(req: Request) {
  try {
    const { url, provider = "jina" } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const client = createScrapeClient({
      provider: provider === "local" ? local() : jina(),
      fallback: local(),
    });

    const result = await client.scrape(url, {
      format: "markdown",
      onlyMainContent: true,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
