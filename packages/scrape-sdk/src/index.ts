import { ScrapeClient } from "./client.js";
import { ScrapeClientConfig } from "./types.js";

export function createScrapeClient(config: ScrapeClientConfig): ScrapeClient {
  return new ScrapeClient(config);
}

export * from "./types.js";
export * from "./errors.js";
export * from "./client.js";
export * from "./from-env.js";
export { htmlToMarkdown, parseHtml } from "./markdown.js";
export { AGENT_MAX_CHARS, clipText } from "./clip.js";
