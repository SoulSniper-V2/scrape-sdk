import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromEnv } from "./from-env.js";

const ENV_KEYS = [
  "FIRECRAWL_API_KEY",
  "FIRECRAWL_KEY",
  "FIRECRAWL_KEYLESS",
  "TINYFISH_API_KEY",
  "TINYFISH_AGENT",
  "TAVILY_API_KEY",
  "SPIDER_API_KEY",
  "SPIDER_KEY",
  "BROWSERBASE_API_KEY",
  "JINA_API_KEY",
  "JINA_KEY",
];

describe("fromEnv provider discovery", () => {
  it("keeps Firecrawl Keyless opt-in while discovering TinyFish from its API key", () => {
    const snapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    try {
      for (const key of ENV_KEYS) delete process.env[key];

      assert.deepEqual(fromEnv({ cache: false }).listProviders(), ["jina", "local"]);
      assert.deepEqual(fromEnv({ cache: false, firecrawlKeyless: true }).listProviders(), [
        "firecrawl",
        "jina",
        "local",
      ]);

      process.env.TINYFISH_API_KEY = "tf-test";
      assert.deepEqual(fromEnv({ cache: false }).listProviders(), ["tinyfish", "jina", "local"]);
      process.env.TINYFISH_AGENT = "1";
      const client = fromEnv({ cache: false, tinyfishAgent: true });
      assert.deepEqual(client.listProviders(), ["tinyfish", "jina", "local"]);
      assert.equal(client.supports("agent"), true);
    } finally {
      for (const key of ENV_KEYS) {
        const value = snapshot[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
