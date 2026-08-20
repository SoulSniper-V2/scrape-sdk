export class ScrapeError extends Error {
  public readonly provider: string;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;

  constructor(message: string, provider: string, statusCode?: number, isRetryable = false) {
    super(`[${provider}] ${message}`);
    this.name = "ScrapeError";
    this.provider = provider;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export class RateLimitError extends ScrapeError {
  constructor(provider: string, message = "Rate limit exceeded (HTTP 429)") {
    super(message, provider, 429, true);
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends ScrapeError {
  constructor(provider: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, provider, 408, true);
    this.name = "TimeoutError";
  }
}

export class AllProvidersFailedError extends Error {
  public readonly errors: Error[];

  constructor(errors: Error[]) {
    const summary = errors.map((e) => e.message).join(" -> ");
    super(`All scrape providers failed: ${summary}`);
    this.name = "AllProvidersFailedError";
    this.errors = errors;
  }
}
