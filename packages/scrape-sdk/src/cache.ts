import { MemoryCacheConfig, ScrapeResult } from "./types.js";

interface Entry {
  value: ScrapeResult;
  expiresAt: number;
}

export class MemoryCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly store = new Map<string, Entry>();

  constructor(config: MemoryCacheConfig = {}) {
    this.ttlMs = finiteAtLeast(config.ttlMs ?? 5 * 60 * 1000, 0, "cache.ttlMs");
    this.maxEntries = integerAtLeast(config.maxEntries ?? 200, 1, "cache.maxEntries");
  }

  get(key: string): ScrapeResult | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return { ...entry.value, cached: true };
  }

  set(key: string, value: ScrapeResult): void {
    if (this.store.size >= this.maxEntries) {
      const first = this.store.keys().next().value;
      if (first) this.store.delete(first);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export function cacheKey(url: string, extra: unknown): string {
  return `${url}::${JSON.stringify(extra ?? {})}`;
}

function finiteAtLeast(value: number, minimum: number, name: string): number {
  if (!Number.isFinite(value) || value < minimum) {
    throw new RangeError(`${name} must be a finite number >= ${minimum}`);
  }
  return value;
}

function integerAtLeast(value: number, minimum: number, name: string): number {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be an integer >= ${minimum}`);
  }
  return value;
}
