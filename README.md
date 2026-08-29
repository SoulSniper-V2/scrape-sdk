# Scrape SDK

<p align="center">
  <a href="https://www.npmjs.com/package/scrape-sdk"><img alt="npm version" src="https://shieldcn.dev/npm/scrape-sdk.svg?variant=secondary&mode=dark" /></a>
  <a href="https://www.scrape-sdk.com"><img alt="scrape-sdk.com" src="https://shieldcn.dev/badge/site-scrape--sdk.com.svg?variant=secondary&mode=dark" /></a>
  <a href="https://github.com/SoulSniper-V2/scrape-sdk/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/SoulSniper-V2/scrape-sdk/stars.svg?variant=branded&mode=dark" /></a>
  <a href="https://x.com/be_arsh"><img alt="Follow @be_arsh on X" src="https://shieldcn.dev/x/follow/be_arsh.svg?variant=branded&mode=dark" /></a>
</p>

One TypeScript client for scraping URLs to markdown. Pick Firecrawl, TinyFish, Jina, Tavily, Spider, Browserbase, or local Cheerio, then fail over without rewriting callers.

- Adapters against live vendor APIs: Firecrawl v2, TinyFish Fetch/Search/Agent, Jina, Tavily, Spider.cloud, Browserbase Fetch, and Cheerio
- `scrape(url)` is the verb. `map()`, `crawl()`, `extract()`, `search()`, `agent()`, and `scrapeMany()` when a provider can do them
- Abortable timeouts, retries on retryable errors, and automatic failover
- Site/docs roots try `/llms.txt` before HTML
- `fromEnv()` builds the client from the keys you already have
- CLI, Vercel AI SDK tools, and an MCP server for full-page markdown

## Install

```bash
npm install scrape-sdk
```

Works on Node 20+ and Bun. Keep provider API keys out of client code.

## Usage

```ts
import { scrape } from "scrape-sdk";

const page = await scrape("https://stripe.com");
console.log(page.markdown);
console.log(`via ${page.provider} in ${page.latencyMs}ms`);
```

No API key required — Jina + local are always in the chain. Add keys and it fails over:

```ts
import { fromEnv } from "scrape-sdk";

const scraper = fromEnv();
const page = await scraper.scrape("https://stripe.com");
```

Firecrawl Keyless is opt-in so a no-key upgrade does not silently change your network or free-quota usage:

```ts
const scraper = fromEnv({ firecrawlKeyless: true });
```

Or pick the order yourself:

```ts
import { createScrapeClient } from "scrape-sdk";
import { firecrawl } from "scrape-sdk/firecrawl";
import { jina } from "scrape-sdk/jina";
import { local } from "scrape-sdk/local";

const scraper = createScrapeClient({
  providers: [
    firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! }),
    jina(),
    local(),
  ],
});
```

Providers that cannot perform an operation are skipped. If none can, you get a `CapabilityError` instead of a fake result.

## Behavior notes for 0.3.0

- Client timeouts are cumulative across the `/llms.txt` probe, retries, and fallback providers.
- `maxChars: 0` is a hard zero-character limit; non-empty output is marked `truncated`.
- Unsupported adapter options now fail explicitly instead of silently degrading. Target-page `headers` and `format: "html"` can raise `UnsupportedOptionError` on adapters that cannot honor them.

## Methods

| Method | Use when |
| :--- | :--- |
| `scrape(url)` | You already have a URL |
| `search(query)` | You need to find URLs |
| `map(url)` | You need a site's URL list, not bodies |
| `crawl(url)` | You need many page bodies from one site |
| `extract(url, { schema })` | You need structured JSON |
| `scrapeMany(urls)` | You have a list of URLs |
| `agent(url, { goal })` | You need an interactive, multi-step web task |

## Providers

| Provider | Import | Key | scrape | search | map | crawl | extract | JS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Firecrawl v2 / Keyless | `scrape-sdk/firecrawl` | optional | yes | yes | yes | yes | yes | yes |
| TinyFish Fetch/Search + Agent* | `scrape-sdk/tinyfish` | yes | yes | yes | — | — | Agent* | yes |
| Jina | `scrape-sdk/jina` | optional | yes | yes | — | — | — | yes |
| Tavily | `scrape-sdk/tavily` | yes | yes | yes | — | — | — | — |
| Spider.cloud | `scrape-sdk/spider` | yes | yes | — | — | yes | — | yes |
| Browserbase | `scrape-sdk/browserbase` | yes | yes | — | — | — | yes | — |
| Local Cheerio | `scrape-sdk/local` | no | yes | — | — | — | — | no |

`Agent*` is available only when TinyFish is configured with `enableAgent: true`.

TinyFish Fetch/Search are free within the provider's account limits. TinyFish Agent is opt-in because it is a metered goal-based browser run; configure `tinyfish({ apiKey, enableAgent: true })` or `fromEnv({ tinyfishAgent: true })`. TinyFish does not provide native `map()` or `crawl()` in this adapter.

Firecrawl Keyless supports the no-key free surface; use `FIRECRAWL_KEYLESS=1` or `fromEnv({ firecrawlKeyless: true })`. Firecrawl crawl returns a job id; the adapter polls until it finishes. Browserbase is `POST /v1/fetch`, not a Playwright session, so it does not run page JavaScript.

## CLI

```bash
npx scrape-sdk https://stripe.com
npx scrape-sdk search "vercel ai sdk tools"
npx scrape-sdk map https://docs.firecrawl.dev
npx scrape-sdk crawl https://docs.firecrawl.dev --limit 5 --json
npx scrape-sdk scrape https://example.com --provider local
```

## MCP

```json
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-...",
        "FIRECRAWL_KEYLESS": "1",
        "TINYFISH_API_KEY": "sk-tinyfish-...",
        "TINYFISH_AGENT": "1",
        "TAVILY_API_KEY": "tvly-..."
      }
    }
  }
}
```

`scrape_url` returns the full page as markdown — not a summary. Host WebFetch often summarizes; this does not. `map_site`, `crawl_site`, and `extract_json` register when the configured providers support them.

## Documentation

Full docs live at **[scrape-sdk.com/docs](https://www.scrape-sdk.com/docs)**. Good places to start:

- [Quickstart](https://www.scrape-sdk.com/docs/quickstart)
- [Providers](https://www.scrape-sdk.com/docs/providers)
- [Failover](https://www.scrape-sdk.com/docs/concepts/failover-matrix)
- [MCP](https://www.scrape-sdk.com/docs/guides/model-context-protocol)
- [Vercel AI SDK tools](https://www.scrape-sdk.com/docs/guides/vercel-ai-sdk)

## License

MIT © [Arush Wadhawan](https://x.com/be_arsh)
