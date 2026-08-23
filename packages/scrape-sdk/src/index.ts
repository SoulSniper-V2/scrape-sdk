import { ScrapeClient } from "./client.js";
import { ScrapeClientConfig } from "./types.js";

export function createScrapeClient(config: ScrapeClientConfig): ScrapeClient {
  return new ScrapeClient(config);
}

export * from "./types.js";
export * from "./errors.js";
export * from "./client.js";
export * from "./from-env.js";
export * from "./convenience.js";
export { viaLine } from "./via.js";
export { htmlToMarkdown, markdownToText, parseHtml } from "./markdown.js";
export { AGENT_MAX_CHARS, clipText } from "./clip.js";
export { llmsTxtCandidates } from "./url.js";
