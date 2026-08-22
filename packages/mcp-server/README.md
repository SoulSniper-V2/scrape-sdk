# scrape-sdk-mcp

MCP server for [scrape-sdk](https://www.npmjs.com/package/scrape-sdk). Returns the **full page as markdown** (not a summary), with failover across Firecrawl, Jina, Tavily, Spider, Browserbase Fetch, and local Cheerio.

Host WebFetch in Cursor / Claude Code / Codex often summarizes. `scrape_url` does not.

## Install

```bash
npx -y scrape-sdk-mcp
```

This package depends on `scrape-sdk`. You do not install that separately when using `npx`.

## Cursor / Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-...",
        "TAVILY_API_KEY": "tvly-...",
        "JINA_API_KEY": "jina_..."
      }
    }
  }
}
```

No keys required for a basic scrape (Jina + local). Paid keys unlock better engines and extra tools.

## Tools

| Tool | When |
| :--- | :--- |
| `scrape_url` | Always. Full page markdown, default 20_000 chars. |
| `search_web` | If `TAVILY_API_KEY` or `FIRECRAWL_API_KEY` is set. |
| `map_site` | If a configured provider supports map (Firecrawl). |
| `crawl_site` | If a configured provider supports crawl. |
| `extract_json` | If a configured provider supports extract. |

## App code

For TypeScript in your product, install the library instead of this server:

```bash
npm install scrape-sdk
```

```ts
import { scrape } from "scrape-sdk";
const page = await scrape("https://stripe.com");
```

Docs: [scrape-sdk.com/docs/guides/model-context-protocol](https://www.scrape-sdk.com/docs/guides/model-context-protocol)

## License

MIT © [Arush Wadhawan](https://x.com/be_arsh)
