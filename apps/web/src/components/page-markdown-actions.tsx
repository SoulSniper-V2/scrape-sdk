"use client";

import { useState } from "react";

export function PageMarkdownActions({ markdownUrl }: { markdownUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    const res = await fetch(markdownUrl);
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-row flex-wrap gap-2 items-center pb-4">
      <button
        type="button"
        onClick={() => void copyMarkdown()}
        className="text-xs px-2.5 py-1 rounded border border-[#2b2b27] text-[#dedcd4] hover:bg-[#141412]"
      >
        {copied ? "Copied" : "Copy Markdown"}
      </button>
      <a
        href={markdownUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs px-2.5 py-1 rounded border border-[#2b2b27] text-[#dedcd4] hover:bg-[#141412]"
      >
        View Markdown
      </a>
    </div>
  );
}
