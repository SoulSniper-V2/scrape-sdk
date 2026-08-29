import {
  AdapterHttp,
  AgentOptions,
  AgentResult,
  ExtractOptions,
  ExtractResult,
  ScrapeOptions,
  ScrapeProvider,
  ScrapeResult,
  SearchHit,
  SearchOptions,
  SearchResult,
} from "../types.js";
import { ProviderResponseError, UnsupportedOptionError } from "../errors.js";
import { jsonInit, request, requestJson, sleep } from "../http.js";
import { markdownToText } from "../markdown.js";

export interface TinyFishConfig extends Partial<AdapterHttp> {
  apiKey: string;
  fetchUrl?: string;
  searchUrl?: string;
  agentUrl?: string;
  enableAgent?: boolean;
  pollIntervalMs?: number;
}

interface TinyFishFetchResult {
  url?: unknown;
  final_url?: unknown;
  title?: unknown;
  description?: unknown;
  language?: unknown;
  text?: unknown;
  links?: unknown;
  image_links?: unknown;
  latency_ms?: unknown;
  format?: unknown;
  author?: unknown;
  published_date?: unknown;
}

interface TinyFishFetchError {
  url?: unknown;
  error?: unknown;
  code?: unknown;
  message?: unknown;
  status?: unknown;
}

interface TinyFishFetchResponse {
  results?: unknown;
  errors?: unknown;
}

interface TinyFishSearchResult {
  url?: unknown;
  title?: unknown;
  snippet?: unknown;
  date?: unknown;
  publisher?: unknown;
  authors?: unknown;
  venue?: unknown;
  year?: unknown;
  cited_by_count?: unknown;
  pdf_url?: unknown;
}

interface TinyFishSearchResponse {
  results?: unknown;
  total_results?: unknown;
  page?: unknown;
}

interface TinyFishAgentStartResponse {
  run_id?: unknown;
  error?: unknown;
}

interface TinyFishAgentRunResponse {
  run_id?: unknown;
  status?: unknown;
  result?: unknown;
  error?: unknown;
  num_of_steps?: unknown;
  steps?: unknown;
}

const PROVIDER = "tinyfish";
const DEFAULT_FETCH_URL = "https://api.fetch.tinyfish.ai";
const DEFAULT_SEARCH_URL = "https://api.search.tinyfish.ai";
const DEFAULT_AGENT_URL = "https://agent.tinyfish.ai";
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const PAID_OPERATION_COST = 100;
const MAX_SEARCH_RESULTS = 20;
const MAX_SEARCH_PAGE = 10;

export function tinyfish(config: TinyFishConfig): ScrapeProvider {
  const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  const fetchUrl = normalizeEndpoint(config.fetchUrl, DEFAULT_FETCH_URL);
  const searchUrl = normalizeEndpoint(config.searchUrl, DEFAULT_SEARCH_URL);
  const agentUrl = normalizeEndpoint(config.agentUrl, DEFAULT_AGENT_URL);
  const agentEnabled = config.enableAgent === true;
  const pollIntervalMs = normalizePollInterval(config.pollIntervalMs);
  const authHeaders = { "X-API-Key": config.apiKey };

  const runAgent = async (url: string, options: AgentOptions): Promise<AgentResult> => {
    if (!agentEnabled) throw new UnsupportedOptionError("agent", PROVIDER);

    const startedAt = Date.now();
    let runId: string | undefined;

    try {
      const queued = await requestJson<TinyFishAgentStartResponse>(
        fetchFn,
        `${agentUrl}/v1/automation/run-async`,
        {
          ...jsonInit(buildAgentRequest(url, options), authHeaders),
          signal: options.signal,
        },
        PROVIDER
      );
      if (!isRecord(queued)) {
        throw new ProviderResponseError(PROVIDER, "TinyFish Agent returned an invalid start response");
      }

      if (queued.error !== undefined && queued.error !== null) {
        throw agentResponseError("Agent run could not be started", queued.error);
      }

      runId = stringValue(queued.run_id);
      if (!runId) {
        throw new ProviderResponseError(PROVIDER, "TinyFish Agent returned no run_id");
      }

      for (;;) {
        throwIfAborted(options.signal);
        const run = await requestJson<TinyFishAgentRunResponse>(
          fetchFn,
          `${agentUrl}/v1/runs/${encodeURIComponent(runId)}`,
          { method: "GET", headers: authHeaders, signal: options.signal },
          PROVIDER
        );
        if (!isRecord(run)) {
          throw new ProviderResponseError(PROVIDER, "TinyFish Agent returned an invalid run response");
        }
        const status = agentStatus(run.status);

        if (status === "completed" || status === "failed" || status === "cancelled") {
          return mapAgentResult(url, runId, status, run, Date.now() - startedAt);
        }

        await sleep(pollIntervalMs, options.signal);
      }
    } catch (error: unknown) {
      if (options.signal?.aborted && runId) {
        await cancelAgentRun(runId);
        throw abortReason(options.signal);
      }
      throw error;
    }
  };

  const scrape = async (url: string, options?: ScrapeOptions): Promise<ScrapeResult> => {
    rejectUnsupportedScrapeOptions(options);

    if (options?.format === "json" && !options.schema) {
      throw new UnsupportedOptionError("format:json", PROVIDER);
    }

    if (options?.schema) {
      if (!agentEnabled) throw new UnsupportedOptionError("schema", PROVIDER);
      const result = await runAgent(url, {
        goal: options.prompt?.trim() || "Extract the requested structured data from this page.",
        schema: options.schema,
        signal: options.signal,
      });
      return mapAgentScrapeResult(url, result);
    }

    const startedAt = Date.now();
    const requestedFormat = options?.format === "html" ? "html" : "markdown";
    const body: Record<string, unknown> = {
      urls: [url],
      format: requestedFormat,
      links: options?.includeLinks ?? false,
      image_links: options?.includeImages ?? false,
    };
    if (options?.purpose !== undefined) body.purpose = options.purpose;
    if (options?.includeSelectors !== undefined) body.include_selectors = options.includeSelectors;
    if (options?.excludeSelectors !== undefined) body.exclude_selectors = options.excludeSelectors;

    const response = await requestJson<TinyFishFetchResponse>(
      fetchFn,
      fetchUrl,
      {
        ...jsonInit(body, authHeaders),
        signal: options?.signal,
      },
      PROVIDER
    );
    if (!isRecord(response)) {
      throw new ProviderResponseError(PROVIDER, "TinyFish Fetch returned an invalid response");
    }

    const results = arrayOf<TinyFishFetchResult>(response.results);
    const errors = arrayOf<TinyFishFetchError>(response.errors);
    const error = errors.find((entry) => stringValue(entry.url) === url) ?? (!results.length ? errors[0] : undefined);
    if (error) throw fetchResponseError(url, error);

    const page = results.find((entry) => stringValue(entry.url) === url) ?? results[0];
    if (!page) {
      throw new ProviderResponseError(PROVIDER, `TinyFish Fetch returned no result for ${url}`);
    }
    return mapFetchResult(url, page, options?.format, startedAt);
  };

  const search = async (query: string, options?: SearchOptions): Promise<SearchResult> => {
    validateSearchOptions(options);
    const limit = searchLimit(options?.limit);
    const startedAt = Date.now();
    const results: SearchHit[] = [];

    for (let page = 0; page <= MAX_SEARCH_PAGE && results.length < limit; page += 1) {
      const endpoint = new URL(searchUrl);
      endpoint.searchParams.set("query", query);
      if (options?.purpose !== undefined) endpoint.searchParams.set("purpose", options.purpose);
      if (options?.location !== undefined) endpoint.searchParams.set("location", options.location);
      if (options?.language !== undefined) endpoint.searchParams.set("language", options.language);
      if (options?.includeDomains !== undefined) {
        endpoint.searchParams.set("include_domains", options.includeDomains.join(","));
      }
      if (options?.excludeDomains !== undefined) {
        endpoint.searchParams.set("exclude_domains", options.excludeDomains.join(","));
      }
      if (options?.recencyMinutes !== undefined) {
        endpoint.searchParams.set("recency_minutes", String(options.recencyMinutes));
      }
      if (options?.afterDate !== undefined) endpoint.searchParams.set("after_date", options.afterDate);
      if (options?.beforeDate !== undefined) endpoint.searchParams.set("before_date", options.beforeDate);
      if (options?.domainType !== undefined) endpoint.searchParams.set("domain_type", options.domainType);
      endpoint.searchParams.set("page", String(page));

      const response = await requestJson<TinyFishSearchResponse>(
        fetchFn,
        endpointHref(endpoint),
        { method: "GET", headers: authHeaders, signal: options?.signal },
        PROVIDER
      );
      if (!isRecord(response)) {
        throw new ProviderResponseError(PROVIDER, "TinyFish Search returned an invalid response");
      }
      const pageResults = arrayOf<TinyFishSearchResult>(response.results);
      if (pageResults.length === 0) break;
      results.push(...pageResults.map(mapSearchResult));

      const totalResults = numberValue(response.total_results);
      if (totalResults !== undefined && results.length >= totalResults) break;
    }

    return {
      query,
      results: results.slice(0, limit),
      provider: PROVIDER,
      latencyMs: Date.now() - startedAt,
    };
  };

  const provider: ScrapeProvider = {
    name: PROVIDER,
    capabilities: agentEnabled
      ? ["scrape", "search", "js", "agent", "extract"]
      : ["scrape", "search", "js"],
    cost: 0,
    costs: agentEnabled
      ? { scrape: 0, search: 0, agent: PAID_OPERATION_COST, extract: PAID_OPERATION_COST }
      : { scrape: 0, search: 0 },
    scrape,
    search,
  };

  if (agentEnabled) {
    provider.agent = runAgent;
    provider.extract = async (url: string, options: ExtractOptions): Promise<ExtractResult> => {
      const result = await runAgent(url, {
        goal: options.prompt?.trim() || "Extract the requested structured data from this page.",
        schema: options.schema,
        signal: options.signal,
      });
      if (result.status !== "completed") throw agentTerminalError(result);
      return {
        url: result.url,
        data: result.data ?? {},
        provider: PROVIDER,
        latencyMs: result.latencyMs,
      };
    };
  }

  return provider;

  async function cancelAgentRun(runId: string): Promise<void> {
    try {
      await request(
        fetchFn,
        `${agentUrl}/v1/runs/${encodeURIComponent(runId)}/cancel`,
        { method: "POST", headers: authHeaders },
        PROVIDER
      );
    } catch {
      // Preserve the caller's abort reason even if the best-effort cancellation fails.
    }
  }
};

function normalizeEndpoint(value: string | undefined, fallback: string): string {
  return (value || fallback).replace(/\/+$/, "");
}

function endpointHref(endpoint: URL): string {
  return endpoint.pathname === "/" ? `${endpoint.origin}${endpoint.search}` : endpoint.href;
}

function normalizePollInterval(value: number | undefined): number {
  const interval = value ?? DEFAULT_POLL_INTERVAL_MS;
  if (!Number.isFinite(interval) || interval < 0) {
    throw new RangeError("pollIntervalMs must be a finite number >= 0");
  }
  return interval;
}

function rejectUnsupportedScrapeOptions(options?: ScrapeOptions): void {
  if (options?.headers !== undefined) throw new UnsupportedOptionError("headers", PROVIDER);
  if (options?.waitForMs !== undefined) throw new UnsupportedOptionError("waitForMs", PROVIDER);
  if (options?.onlyMainContent === false) {
    throw new UnsupportedOptionError("onlyMainContent:false", PROVIDER);
  }
}

function validateSearchOptions(options?: SearchOptions): void {
  if (options?.includeAnswer) throw new UnsupportedOptionError("includeAnswer", PROVIDER);
  if (options?.includeRawContent) throw new UnsupportedOptionError("includeRawContent", PROVIDER);
  if (
    options?.recencyMinutes !== undefined &&
    (options.afterDate !== undefined || options.beforeDate !== undefined)
  ) {
    throw new ProviderResponseError(
      PROVIDER,
      "TinyFish Search does not allow recencyMinutes with afterDate or beforeDate"
    );
  }
  if (
    options?.domainType === "research_paper" &&
    (options.recencyMinutes !== undefined || options.afterDate !== undefined || options.beforeDate !== undefined)
  ) {
    throw new ProviderResponseError(
      PROVIDER,
      "TinyFish research_paper searches require publication-year filters instead of date filters"
    );
  }
}

function buildAgentRequest(url: string, options: AgentOptions): Record<string, unknown> {
  const agentConfig: Record<string, unknown> = {};
  if (options.maxSteps !== undefined) agentConfig.max_steps = options.maxSteps;
  if (options.maxDurationSeconds !== undefined) {
    agentConfig.max_duration_seconds = options.maxDurationSeconds;
  }

  return {
    url,
    goal: options.goal,
    ...(options.schema !== undefined ? { output_schema: options.schema } : {}),
    ...(options.browserProfile !== undefined ? { browser_profile: options.browserProfile } : {}),
    agent_config: agentConfig,
  };
}

function mapFetchResult(
  requestedUrl: string,
  page: TinyFishFetchResult,
  requestedFormat: ScrapeOptions["format"],
  startedAt: number
): ScrapeResult {
  if (typeof page.text !== "string") {
    throw new ProviderResponseError(PROVIDER, `TinyFish Fetch returned no text for ${requestedUrl}`);
  }

  const originalUrl = stringValue(page.url) || requestedUrl;
  const finalUrl = stringValue(page.final_url);
  const resultUrl = finalUrl || originalUrl;
  const returnedFormat = page.format === "html" || page.format === "markdown" ? page.format : undefined;
  const contentFormat = returnedFormat ?? (requestedFormat === "html" ? "html" : "markdown");
  const metadata: ScrapeResult["metadata"] = {
    statusCode: 200,
    requestedUrl: originalUrl,
    format: returnedFormat ?? contentFormat,
  };
  if (finalUrl) metadata.finalUrl = finalUrl;
  if (typeof page.description === "string") metadata.description = page.description;
  if (typeof page.language === "string") metadata.language = page.language;
  if (typeof page.author === "string") metadata.author = page.author;
  if (typeof page.published_date === "string") metadata.publishedDate = page.published_date;

  return {
    url: resultUrl,
    title: stringValue(page.title) || "",
    markdown: contentFormat === "markdown" ? page.text : "",
    html: contentFormat === "html" ? page.text : undefined,
    text: requestedFormat === "text" ? markdownToText(page.text) : undefined,
    links: stringArray(page.links),
    images: stringArray(page.image_links),
    metadata,
    provider: PROVIDER,
    latencyMs: numberValue(page.latency_ms) ?? Math.max(0, Date.now() - startedAt),
    costCredits: 0,
  };
}

function mapSearchResult(result: TinyFishSearchResult): SearchHit {
  const metadata: Record<string, unknown> = {};
  for (const key of ["date", "publisher", "authors", "venue", "year", "cited_by_count", "pdf_url"] as const) {
    if (result[key] !== undefined) metadata[key] = result[key];
  }
  return {
    url: stringValue(result.url) || "",
    title: stringValue(result.title) || "",
    snippet: stringValue(result.snippet) || "",
    ...(Object.keys(metadata).length ? { metadata } : {}),
  };
}

function mapAgentResult(
  url: string,
  runId: string,
  status: AgentResult["status"],
  run: TinyFishAgentRunResponse,
  latencyMs: number
): AgentResult {
  const steps = numberValue(run.num_of_steps) ?? (Array.isArray(run.steps) ? run.steps.length : undefined);
  return {
    url,
    data: run.result,
    runId,
    status,
    provider: PROVIDER,
    latencyMs,
    steps,
    error: run.error,
  };
}

function mapAgentScrapeResult(url: string, result: AgentResult): ScrapeResult {
  if (result.status !== "completed") throw agentTerminalError(result);
  return {
    url: result.url || url,
    title: "",
    markdown: "",
    json: result.data,
    metadata: { statusCode: 200, runId: result.runId },
    provider: PROVIDER,
    latencyMs: result.latencyMs,
  };
}

function agentStatus(value: unknown): AgentResult["status"] {
  const normalized = stringValue(value)?.toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "running" ||
    normalized === "completed" ||
    normalized === "failed" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }
  throw new ProviderResponseError(PROVIDER, `TinyFish Agent returned unknown run status: ${String(value)}`);
}

function agentTerminalError(result: AgentResult): ProviderResponseError {
  const detail = errorDetail(result.error);
  return new ProviderResponseError(
    PROVIDER,
    `TinyFish Agent run ${result.status}${detail ? `: ${detail}` : ""}`
  );
}

function agentResponseError(prefix: string, value: unknown): ProviderResponseError {
  const code = errorCode(value);
  const detail = errorDetail(value);
  const suffix = [code, detail && detail !== code ? detail : undefined].filter(Boolean).join(": ");
  const error = new ProviderResponseError(PROVIDER, `${prefix}${suffix ? `: ${suffix}` : ""}`) as ProviderResponseError & {
    code?: string;
  };
  if (code) error.code = code;
  return error;
}

function fetchResponseError(url: string, value: TinyFishFetchError): ProviderResponseError {
  const code = errorCode(value);
  const status = numberValue(value.status);
  const detail = errorDetail(value);
  const statusText = status === undefined ? undefined : `HTTP ${status}`;
  const suffix = [code, statusText, detail && detail !== code ? detail : undefined].filter(Boolean).join(": ");
  const error = new ProviderResponseError(
    PROVIDER,
    `TinyFish Fetch failed for ${url}${suffix ? `: ${suffix}` : ""}`
  ) as ProviderResponseError & { code?: string };
  if (code) error.code = code;
  return error;
}

function errorCode(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return stringValue(record.code) || stringValue(record.error);
}

function errorDetail(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return stringValue(record.message) || stringValue(record.detail) || stringValue(record.help_message);
}

function searchLimit(value: number | undefined): number {
  const limit = value ?? 8;
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError("search limit must be an integer >= 0");
  }
  return Math.min(limit, MAX_SEARCH_RESULTS);
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter(isRecord) as T[] : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortReason(signal);
}

function abortReason(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  const error = new Error(signal.reason === undefined ? "The operation was aborted" : String(signal.reason));
  error.name = "AbortError";
  return error;
}
