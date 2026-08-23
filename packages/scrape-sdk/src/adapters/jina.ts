import { AdapterHttp, ScrapeOptions, ScrapeProvider, ScrapeResult, SearchOptions, SearchResult } from "../types.js";
import { ProviderResponseError, UnsupportedOptionError } from "../errors.js";
import { jsonInit, request, requestJson } from "../http.js";
import { markdownToText } from "../markdown.js";

export interface JinaConfig extends Partial<AdapterHttp> {
  apiKey?: string;
}

interface JinaJson {
  code?: number;
  status?: number;
  data?: {
    title?: string;
    url?: string;
    content?: string;
    description?: string;
    images?: string[];
    links?: { url?: string }[] | string[];
  };
  title?: string;
  content?: string;
}

export function jina(config: JinaConfig = {}): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);

  function headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {
      Accept: "application/json",
      "X-Return-Format": "markdown",
      ...extra,
    };
    if (config.apiKey) h.Authorization = `Bearer ${config.apiKey}`;
    return h;
  }

  return {
    name: "jina",
    capabilities: ["scrape", "search", "js"],
    cost: 10,
    async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
      if (options?.headers) throw new UnsupportedOptionError("headers", "jina");
      if (options?.format === "html") throw new UnsupportedOptionError("format:html", "jina");
      if (options?.format === "json" && !options.schema) {
        throw new UnsupportedOptionError("format:json", "jina");
      }
      const startTime = Date.now();
      const extra: Record<string, string> = {};
      if (options?.onlyMainContent !== false) {
        extra["X-Target-Selector"] = "main, article, #content, [role='main']";
      }
      if (options?.waitForMs) extra["X-Wait-For-Selector"] = "body";
      extra["X-With-Links-Summary"] = options?.includeLinks ? "all" : "none";
      extra["X-With-Images-Summary"] = options?.includeImages ? "all" : "none";

      const targetUrl = `https://r.jina.ai/${url}`;
      const response = await request(fetchFn, targetUrl, { headers: headers(extra), signal: options?.signal }, "jina");
      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();

      if (contentType.includes("json")) {
        let json: JinaJson;
        try {
          json = JSON.parse(body) as JinaJson;
        } catch {
          throw new ProviderResponseError("jina", "Jina returned invalid JSON");
        }
        if ((json.code !== undefined && json.code >= 400) || (json.status !== undefined && json.status >= 400)) {
          throw new ProviderResponseError("jina", "Jina returned a failed response envelope");
        }
        const data = json.data ?? {
          title: json.title,
          content: json.content,
        };
        const markdown = data.content || "";
        return {
          url: data.url || url,
          title: data.title || titleFromMarkdown(markdown),
          markdown,
          text: options?.format === "text" ? markdownToText(markdown) : undefined,
          links: normalizeLinks(data.links),
          images: data.images,
          metadata: {
            description: data.description,
            statusCode: 200,
          },
          provider: "jina",
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        url,
        title: titleFromMarkdown(body),
        markdown: body,
        text: options?.format === "text" ? markdownToText(body) : undefined,
        metadata: { statusCode: 200 },
        provider: "jina",
        latencyMs: Date.now() - startTime,
      };
    },

    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
      const startTime = Date.now();
      const json = await requestJson<{
        data?: Array<{ url?: string; title?: string; description?: string; content?: string }>;
      }>(
        fetchFn,
        "https://s.jina.ai/",
        {
          ...jsonInit({ q: query, num: options?.limit ?? 8 }, headers()),
          signal: options?.signal,
        },
        "jina"
      );

      const rows = json.data || [];
      return {
        query,
        results: rows.map((row) => ({
          url: row.url || "",
          title: row.title || "",
          snippet: row.description || "",
          content: row.content,
        })),
        provider: "jina",
        latencyMs: Date.now() - startTime,
      };
    },
  };
}

function titleFromMarkdown(markdown: string): string {
  const match = markdown.match(/^Title:\s*(.+)$/m) || markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function normalizeLinks(links: Array<string | { url?: string }> | undefined): string[] | undefined {
  if (!links) return undefined;
  return links.map((item) => (typeof item === "string" ? item : item.url || "")).filter(Boolean);
}
