export default function McpGuide() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Model Context Protocol (MCP)</h1>
        <p className="text-sm text-[#a09f97]">Enable live web scraping inside Claude Desktop, Cursor, and Hermes.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Claude Desktop Setup</h3>
        <p className="text-xs text-[#8f8e87]">Add to claude_desktop_config.json:</p>
        <pre className="p-4 rounded border border-[#2b2b27] bg-[#090908] font-mono text-xs text-[#dedcd4]">
          <code>{`{
  "mcpServers": {
    "scrape-sdk": {
      "command": "npx",
      "args": ["-y", "scrape-sdk-mcp"]
    }
  }
}`}</code>
        </pre>
      </div>
    </div>
  );
}
