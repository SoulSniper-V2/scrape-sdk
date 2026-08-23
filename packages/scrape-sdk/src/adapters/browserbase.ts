import {
  AdapterHttp,
  ExtractOptions,
  ExtractResult,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
} from "../types.js";
import { ProviderResponseError, UnsupportedOptionError } from "../errors.js";
import { jsonInit, requestJson } from "../http.js";
import { firstHeading } from "../heading.js";
import { markdownToText } from "../markdown.js";

export interface BrowserbaseConfig extends Partial<AdapterHttp> {
  apiKey: string;
  /** Optional. Enables proxy routing on Fetch. */
  proxies?: boolean;
}

interface BrowserbaseFetchResponse {
  success?: boolean;
  content?: string;
  statusCode?: number;
  contentType?: string;
  title?: string;
  error?: string;
}

export function browserbase(config: BrowserbaseConfig): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);

  return {
    name: "browserbase",
    capabilities: ["scrape", "extract"],
    cost: 40,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      if (options?.headers) throw new UnsupportedOptionError("headers", "browserbase");
      if (options?.format === "json" && !options.schema) {
        throw new UnsupportedOptionError("format:json", "browserbase");
      }
      const startTime = Date.now();
      const requestedFormat = options?.format ?? "markdown";
      const format = options?.schema ? "json" : requestedFormat === "html" ? "raw" : "markdown";
      const json = await requestJson<BrowserbaseFetchResponse>(
        fetchFn,
        "https://api.browserbase.com/v1/fetch",
        {
          ...jsonInit(
            {
              url,
              format,
              allowRedirects: true,
              proxies: config.proxies ?? false,
              schema: options?.schema,
            },
            { "X-BB-API-Key": config.apiKey }
          ),
          signal: options?.signal,
        },
        "browserbase"
      );

      if (json.success === false || json.error) {
        throw new ProviderResponseError("browserbase", json.error || "Browserbase returned a failed response envelope");
      }
      if (typeof json.content !== "string") {
        throw new ProviderResponseError("browserbase", "Browserbase returned no content");
      }
      const content = json.content || "";
      return {
        url,
        title: json.title || firstHeading(content),
        markdown: format === "markdown" ? content : "",
        html: format === "raw" ? content : undefined,
        json: format === "json" ? tryParse(content) : undefined,
        text: requestedFormat === "text" ? markdownToText(content) : undefined,
        metadata: {
          statusCode: json.statusCode ?? 200,
          contentType: json.contentType,
        },
        provider: "browserbase",
        latencyMs: Date.now() - startTime,
      };
    },

    async extract(url: string, options: ExtractOptions): Promise<ExtractResult> {
      const scraped = await this.scrape(url, {
        schema: options.schema,
        signal: options.signal,
        format: "json",
      });
      return {
        url: scraped.url,
        data: scraped.json ?? {},
        provider: "browserbase",
        latencyMs: scraped.latencyMs,
      };
    },
  };
}

function tryParse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}
