import { describe, it, expect } from "vitest";
import { redactKeys, networkErrorDetail } from "./util.js";
import { HOSTED_PRESETS } from "../cli/hostedPresets.js";

describe("redactKeys", () => {
  it("masks every key format Open42 accepts (kept in sync with HOSTED_PRESETS)", () => {
    for (const preset of HOSTED_PRESETS) {
      const key = `${preset.keyPrefix}ABCDEF1234567890secretvalue`;
      const redacted = redactKeys(`error: invalid api key ${key} was rejected`);
      // The full secret must never survive redaction.
      expect(redacted).not.toContain(key);
      expect(redacted).toContain("***");
    }
  });

  it("masks a NVIDIA and a Groq key specifically (regression for the audit)", () => {
    expect(redactKeys("bad key nvapi-abc123def456")).toBe("bad key nvapi-***");
    expect(redactKeys("bad key gsk_abc123def456")).toBe("bad key gsk_***");
  });

  it("leaves ordinary error text untouched", () => {
    expect(redactKeys("HTTP 404 - model not found")).toBe("HTTP 404 - model not found");
  });
});

describe("networkErrorDetail", () => {
  it("prefers the cause code (e.g. ECONNREFUSED) over the generic message", () => {
    const err = new Error("fetch failed");
    (err as Error & { cause?: unknown }).cause = { code: "ECONNREFUSED" };
    expect(networkErrorDetail(err)).toBe("ECONNREFUSED");
  });

  it("falls back to the error message, then to String()", () => {
    expect(networkErrorDetail(new Error("boom"))).toBe("boom");
    expect(networkErrorDetail("weird")).toBe("weird");
  });
});
