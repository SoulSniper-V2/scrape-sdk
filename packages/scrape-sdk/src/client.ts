import {
  ScrapeClientConfig,
  ScrapeOptions,
  ScrapeResult,
  CrawlOptions,
  CrawlResult,
  ScrapeProvider,
} from "./types.js";
import { AllProvidersFailedError, TimeoutError } from "./errors.js";

export class ScrapeClient {
  private readonly primaryProvider: ScrapeProvider;
  private readonly fallbackProviders: ScrapeProvider[];
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly onFailover?: ScrapeClientConfig["onFailover"];

  constructor(config: ScrapeClientConfig) {
    this.primaryProvider = config.provider;
    this.fallbackProviders = Array.isArray(config.fallback)
      ? config.fallback
      : config.fallback
      ? [config.fallback]
      : [];
    this.timeoutMs = config.timeoutMs || 25000;
    this.retries = config.retries || 1;
    this.onFailover = config.onFailover;
  }

  private get providerChain(): ScrapeProvider[] {
    return [this.primaryProvider, ...this.fallbackProviders];
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    providerName: string,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(providerName, timeoutMs));
      }, timeoutMs);

      fn()
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
    const errors: Error[] = [];

    for (let i = 0; i < this.providerChain.length; i++) {
      const provider = this.providerChain[i];

      for (let attempt = 0; attempt <= this.retries; attempt++) {
        try {
          const result = await this.executeWithTimeout(
            () => provider.scrape(url, options),
            provider.name,
            this.timeoutMs
          );
          return result;
        } catch (err: any) {
          errors.push(err);
          const nextProvider = this.providerChain[i + 1];

          if (attempt === this.retries && nextProvider && this.onFailover) {
            this.onFailover(err, provider.name, nextProvider.name);
          }
        }
      }
    }

    throw new AllProvidersFailedError(errors);
  }

  public async crawl(url: string, options?: CrawlOptions): Promise<CrawlResult> {
    const errors: Error[] = [];

    for (const provider of this.providerChain) {
      if (!provider.crawl) continue;

      try {
        const result = await this.executeWithTimeout(
          () => provider.crawl!(url, options),
          provider.name,
          this.timeoutMs * 2
        );
        return result;
      } catch (err: any) {
        errors.push(err);
      }
    }

    throw new AllProvidersFailedError(errors);
  }
}
