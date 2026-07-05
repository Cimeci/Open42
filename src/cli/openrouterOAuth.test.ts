import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { generatePkce, buildAuthUrl, exchangeCodeForKey } from "./openrouterOAuth.js";

describe("generatePkce", () => {
  it("derives the challenge as the base64url sha256 of the verifier (S256)", () => {
    const { verifier, challenge } = generatePkce();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    const expected = createHash("sha256").update(verifier).digest("base64url");
    expect(challenge).toBe(expected);
    // base64url has no +, /, or = padding.
    expect(challenge).not.toMatch(/[+/=]/);
  });

  it("produces a different verifier each call", () => {
    expect(generatePkce().verifier).not.toBe(generatePkce().verifier);
  });
});

describe("buildAuthUrl", () => {
  it("targets openrouter /auth with the PKCE parameters", () => {
    const url = new URL(buildAuthUrl("http://localhost:4567", "chal-xyz"));
    expect(url.origin + url.pathname).toBe("https://openrouter.ai/auth");
    expect(url.searchParams.get("callback_url")).toBe("http://localhost:4567");
    expect(url.searchParams.get("code_challenge")).toBe("chal-xyz");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("exchangeCodeForKey", () => {
  it("posts the code + verifier and returns the API key", async () => {
    let seen: { url: string; body: unknown } | null = null;
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      seen = { url: String(url), body: JSON.parse(String(init?.body)) };
      return new Response(JSON.stringify({ key: "sk-or-v1-secret" }), { status: 200 });
    }) as typeof fetch;

    const key = await exchangeCodeForKey("the-code", "the-verifier", { fetchImpl });
    expect(key).toBe("sk-or-v1-secret");
    expect(seen!.url).toBe("https://openrouter.ai/api/v1/auth/keys");
    expect(seen!.body).toEqual({
      code: "the-code",
      code_verifier: "the-verifier",
      code_challenge_method: "S256",
    });
  });

  it("throws on a non-OK response", async () => {
    const fetchImpl = (async () => new Response("no", { status: 400 })) as typeof fetch;
    await expect(exchangeCodeForKey("c", "v", { fetchImpl })).rejects.toThrow(/exchange failed/i);
  });

  it("throws when the response carries no key", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
    await expect(exchangeCodeForKey("c", "v", { fetchImpl })).rejects.toThrow(/no API key/i);
  });
});
