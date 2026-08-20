import React from "react";

export function ProviderIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  if (name === "firecrawl") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L22 20H2L12 2Z" />
      </svg>
    );
  }
  if (name === "jina") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0L15.7 8.3L24 12L15.7 15.7L12 24L8.3 15.7L0 12L8.3 8.3L12 0Z" />
      </svg>
    );
  }
  if (name === "tavily") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z" />
      </svg>
    );
  }
  if (name === "spider") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
      </svg>
    );
  }
  if (name === "browserbase") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
