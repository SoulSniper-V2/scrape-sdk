export default function McpPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Model Context Protocol (MCP)</h1>
        <p className="text-sm text-[#a09f97]">Give coding agents the real page when host WebFetch only summarizes. Keep host WebSearch for lookup.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Claude Desktop Configuration</h3>
        <p className="text-xs text-[#8f8e87]">Add keys for Firecrawl, TinyFish, Tavily, or Jina. Set FIRECRAWL_KEYLESS=1 for Firecrawl's no-key free path; without cloud providers, scrape still works via Jina + local.</p>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4] overflow-x-auto">
          <code>{`{
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
}`}</code>
        </pre>
      </div>
    </div>
  );
}
