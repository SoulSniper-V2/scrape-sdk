export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://scrape-sdk-olive.vercel.app");

export function markdownUrl(pageUrl: string): string {
  if (pageUrl === "/docs") return "/docs.md";
  return `${pageUrl}.md`;
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex",
} as const;

export const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "X-Robots-Tag": "noindex",
  "Access-Control-Allow-Origin": "*",
} as const;
