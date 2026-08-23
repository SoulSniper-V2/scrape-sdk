import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertPublicHttpUrl, createSafeFetch, isPrivateAddress } from "./security.js";

describe("scrape route SSRF guards", () => {
  it("classifies private, shared, and reserved addresses", () => {
    for (const address of [
      "0.0.0.0",
      "10.0.0.1",
      "127.0.0.1",
      "100.64.0.1",
      "169.254.1.1",
      "172.16.0.1",
      "192.168.1.1",
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
    ]) {
      assert.equal(isPrivateAddress(address), true, address);
    }
    assert.equal(isPrivateAddress("8.8.8.8"), false);
    assert.equal(isPrivateAddress("2001:4860:4860::8888"), false);
  });

  it("rejects loopback URLs before any fetch", async () => {
    await assert.rejects(() => assertPublicHttpUrl("http://127.0.0.1:3000/"), /Private network/);
    await assert.rejects(() => assertPublicHttpUrl("http://[::1]/"), /Private network/);
    await assert.rejects(() => assertPublicHttpUrl("https://user:pass@example.com/"), /credentials/);
    await assert.rejects(() => assertPublicHttpUrl("file:///etc/passwd"), /http\(s\)/);
  });

  it("revalidates redirects and caps response size", async () => {
    let calls = 0;
    const redirecting = createSafeFetch(async () => {
      calls += 1;
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1:3000/" },
      });
    });
    await assert.rejects(() => redirecting("http://8.8.8.8/"), /Private network/);
    assert.equal(calls, 1);

    const oversized = createSafeFetch(
      async () =>
        new Response("small", {
          headers: { "content-length": "2000001" },
        })
    );
    await assert.rejects(() => oversized("http://8.8.8.8/"), /Response exceeds/);
  });
});
