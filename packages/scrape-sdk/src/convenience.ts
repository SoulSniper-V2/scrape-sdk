import { ScrapeClient } from "./client.js";
import { fromEnv } from "./from-env.js";
import {
  BatchScrapeOptions,
  AgentOptions,
  CrawlOptions,
  ExtractOptions,
  MapOptions,
  ScrapeOptions,
  SearchOptions,
} from "./types.js";

let defaultClient: ScrapeClient | undefined;

export function getDefaultClient(): ScrapeClient {
  return (defaultClient ??= fromEnv());
}

/** Drop the cached default client (after env changes, or in tests). */
export function resetDefaultClient(): void {
  defaultClient = undefined;
}

export function setDefaultClient(client: ScrapeClient | undefined): void {
  defaultClient = client;
}

/** One-shot scrape using `fromEnv()` (Jina + local, plus any keys in the environment). */
export function scrape(url: string, options?: ScrapeOptions) {
  return getDefaultClient().scrape(url, options);
}

export function scrapeMany(urls: string[], options?: BatchScrapeOptions) {
  return getDefaultClient().scrapeMany(urls, options);
}

export function search(query: string, options?: SearchOptions) {
  return getDefaultClient().search(query, options);
}

export function map(url: string, options?: MapOptions) {
  return getDefaultClient().map(url, options);
}

export function crawl(url: string, options?: CrawlOptions) {
  return getDefaultClient().crawl(url, options);
}

export function extract(url: string, options: ExtractOptions) {
  return getDefaultClient().extract(url, options);
}

export function agent(url: string, options: AgentOptions) {
  return getDefaultClient().agent(url, options);
}
