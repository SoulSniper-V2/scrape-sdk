import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { ScrapeProvider, ScrapeOptions, ScrapeResult } from "../types.js";
import { ScrapeError } from "../errors.js";

export interface LocalConfig {
  userAgent?: string;
}

export function local(config: LocalConfig = {}): ScrapeProvider {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Remove script, style, nav, footer tags
  turndown.remove(["script", "style", "noscript"]);

  return {
    name: "local",
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      const startTime = Date.now();
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            config.userAgent ||
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 ScrapeSDK/0.1",
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        throw new ScrapeError(`HTTP fetch failed with status ${response.status}`, "local", response.status);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Clean unwanted elements
      $("script, style, noscript, nav, footer, iframe, header").remove();

      const title = $("title").first().text().trim() || $("h1").first().text().trim() || "";
      const description = $('meta[name="description"]').attr("content") || "";
      const ogImage = $('meta[property="og:image"]').attr("content") || "";

      let targetHtml = $.html();
      if (options?.onlyMainContent) {
        const main = $("main, article, #content, .content, .main").first();
        if (main.length) {
          targetHtml = main.html() || targetHtml;
        }
      }

      const markdown = turndown.turndown(targetHtml);

      const links: string[] = [];
      if (options?.includeLinks) {
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (href) links.push(href);
        });
      }

      return {
        url,
        title,
        markdown,
        html: options?.format === "html" ? html : undefined,
        text: options?.format === "text" ? $("body").text().replace(/\s+/g, " ").trim() : undefined,
        links: options?.includeLinks ? links : undefined,
        metadata: {
          description,
          ogImage,
          statusCode: response.status,
        },
        provider: "local",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}
