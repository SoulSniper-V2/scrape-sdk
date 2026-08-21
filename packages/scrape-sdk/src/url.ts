import { InvalidUrlError } from "./errors.js";

export function assertHttpUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new InvalidUrlError(value);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidUrlError(value);
  }
  return parsed;
}

export function originOf(url: string): string {
  return assertHttpUrl(url).origin;
}

const DOCS_ROOTS = new Set(["docs", "documentation", "doc", "guide", "guides", "developers", "dev"]);

/**
 * `/llms.txt` candidates for a site or docs root. Empty for article URLs
 * (we must not replace https://stripe.com/pricing with the site index).
 */
export function llmsTxtCandidates(url: string): string[] {
  const parsed = assertHttpUrl(url);
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (/llms(?:-full)?\.txt$/i.test(path)) return [];

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [`${parsed.origin}/llms.txt`];
  }
  if (segments.length === 1 && DOCS_ROOTS.has(segments[0].toLowerCase())) {
    return [`${parsed.origin}/${segments[0]}/llms.txt`, `${parsed.origin}/llms.txt`];
  }
  return [];
}
