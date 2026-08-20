export default function MarkdownPipelinePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Markdown Pipeline</h1>
        <p className="text-sm text-[#a09f97]">How Scrape SDK eliminates token bloat and generates LLM-ready ATX markdown.</p>
      </div>

      <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-3 font-mono text-xs text-[#dedcd4]">
        <h3 className="font-semibold text-white text-sm mb-2">Sanitization Rules</h3>
        <p>• Removes <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code>, <code>&lt;noscript&gt;</code>, and <code>&lt;svg&gt;</code> tags.</p>
        <p>• Strips advertisement banners, cookie notices, and navigation chrome.</p>
        <p>• Converts semantic HTML headings (h1-h6) to clean ATX markdown (#, ##, ###).</p>
        <p>• Formats tabular data into GitHub Flavored Markdown (GFM) tables.</p>
      </div>
    </div>
  );
}
