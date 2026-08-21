import { AdapterHttp, ScrapeOptions, ScrapeProvider, ScrapeResult } from "../types.js";
import { requestText } from "../http.js";
import { htmlToMarkdown, parseHtml } from "../markdown.js";

export interface LocalConfig extends Partial<AdapterHttp> {
  userAgent?: string;
}

export function local(config: LocalConfig = {}): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);

  return {
    name: "local",
    capabilities: ["scrape"],
    cost: 0,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const html = await requestText(
        fetchFn,
        url,
        {
          headers: {
            "User-Agent":
              config.userAgent ||
              "Mozilla/5.0 (compatible; ScrapeSDK/0.2; +https://github.com/SoulSniper-V2/scrape-sdk)",
            Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            ...(options?.headers || {}),
          },
          signal: options?.signal,
        },
        "local"
      );

      const doc = parseHtml(html, url, options?.onlyMainContent !== false);
      const markdown = htmlToMarkdown(doc.mainHtml);

      return {
        url,
        title: doc.title,
        markdown,
        html: options?.format === "html" ? (options.onlyMainContent === false ? doc.html : doc.mainHtml) : undefined,
        text: options?.format === "text" ? doc.text : undefined,
        links: options?.includeLinks ? doc.links : undefined,
        images: options?.includeImages ? doc.images : undefined,
        metadata: {
          description: doc.description,
          language: doc.language,
          canonicalUrl: doc.canonicalUrl,
          ogImage: doc.ogImage,
          statusCode: 200,
        },
        provider: "local",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
