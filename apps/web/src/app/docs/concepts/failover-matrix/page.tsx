export default function FailoverMatrixPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-editorial text-4xl tracking-tight text-white">Failover Matrix</h1>
        <p className="text-sm text-[#a09f97]">Resilient multi-tier failover mechanics for autonomous agent pipelines.</p>
      </div>

      <div className="p-6 rounded border border-[#2b2b27] bg-[#11110f] space-y-4 text-xs font-mono">
        <div className="flex justify-between pb-3 border-b border-[#2b2b27] text-[#6f6e68]">
          <span>STATUS CODE</span>
          <span>ACTION</span>
          <span>NEXT STATE</span>
        </div>
        <div className="flex justify-between text-[#dedcd4]">
          <span>HTTP 429 (Rate Limit)</span>
          <span className="text-amber-400">Shift to Fallback</span>
          <span>Execute Jina / Local</span>
        </div>
        <div className="flex justify-between text-[#dedcd4]">
          <span>ETIMEDOUT / 504</span>
          <span className="text-amber-400">Shift to Fallback</span>
          <span>Execute Jina / Local</span>
        </div>
        <div className="flex justify-between text-[#dedcd4]">
          <span>HTTP 200 OK</span>
          <span className="text-emerald-400">Normalize & Format</span>
          <span>Return ScrapeResult</span>
        </div>
      </div>
    </div>
  );
}
