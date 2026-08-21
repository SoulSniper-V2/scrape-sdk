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

export class AuthError extends ScrapeError {
  constructor(provider: string, message = "Authentication failed") {
    super(message, provider, 401, false);
    this.name = "AuthError";
  }
}

export class TimeoutError extends ScrapeError {
  constructor(provider: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, provider, 408, true);
    this.name = "TimeoutError";
  }
}

export class CapabilityError extends ScrapeError {
  constructor(operation: string, provider?: string) {
    super(
      provider
        ? `Provider does not support ${operation}`
        : `No configured provider supports ${operation}`,
      provider ?? "client",
      undefined,
      false
    );
    this.name = "CapabilityError";
  }
}

export class InvalidUrlError extends ScrapeError {
  constructor(value: string) {
    super(`Invalid URL: ${value}`, "client", 400, false);
    this.name = "InvalidUrlError";
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

export function isRetryableError(err: unknown): boolean {
  if (err instanceof ScrapeError) return err.isRetryable;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

export function failoverReason(error: Error): string {
  if (error instanceof RateLimitError) return "429";
  if (error instanceof TimeoutError) return "timeout";
  if (error instanceof AuthError) return "auth";
  if (error instanceof ScrapeError && error.statusCode) return String(error.statusCode);
  const name = error.name.replace(/Error$/, "");
  return name ? name.toLowerCase() : "error";
}
