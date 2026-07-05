import { describe, it, expect } from "vitest";
import { HOSTED_PRESETS, configForPreset, identifyToken } from "./hostedPresets.js";
import { isConfigured, createProvider } from "./config.js";

describe("hosted presets", () => {
  it("exposes the known hosted services", () => {
    expect(HOSTED_PRESETS.map((p) => p.id)).toEqual([
      "anthropic",
      "openai",
      "openrouter",
      "nvidia",
      "groq",
    ]);
  });

  it("maps a native preset (OpenAI) to its own provider without a base URL", () => {
    const openai = HOSTED_PRESETS.find((p) => p.id === "openai")!;
    const config = configForPreset(openai, "sk-123", "auto");
    expect(config).toMatchObject({ provider: "openai", apiKey: "sk-123", baseUrl: undefined });
    expect(isConfigured(config)).toBe(true);
  });

  it("maps an OpenAI-compatible preset (NVIDIA) to the custom provider with its base URL", () => {
    const nvidia = HOSTED_PRESETS.find((p) => p.id === "nvidia")!;
    const config = configForPreset(nvidia, "nvapi-xyz", "fr");
    expect(config).toMatchObject({
      provider: "custom",
      apiKey: "nvapi-xyz",
      baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
      model: "meta/llama-3.1-8b-instruct",
    });
    expect(isConfigured(config)).toBe(true);
    // The custom provider builds without throwing.
    expect(typeof createProvider(config).complete).toBe("function");
  });

  it("every preset points at a key page and shows a key hint", () => {
    for (const preset of HOSTED_PRESETS) {
      expect(preset.keyUrl).toMatch(/^https:\/\//);
      expect(preset.keyHint.length).toBeGreaterThan(0);
    }
  });
});

describe("identifyToken", () => {
  it("detects each provider by its key prefix", () => {
    expect(identifyToken("sk-ant-abc123")?.id).toBe("anthropic");
    expect(identifyToken("sk-or-v1-abc123")?.id).toBe("openrouter");
    expect(identifyToken("nvapi-abc123")?.id).toBe("nvidia");
    expect(identifyToken("gsk_abc123")?.id).toBe("groq");
  });

  it("prefers the more specific prefix (OpenRouter over OpenAI's generic sk-)", () => {
    expect(identifyToken("sk-or-v1-xyz")?.id).toBe("openrouter");
    expect(identifyToken("sk-proj-xyz")?.id).toBe("openai");
  });

  it("trims whitespace and returns null for empty or unknown tokens", () => {
    expect(identifyToken("  sk-ant-x  ")?.id).toBe("anthropic");
    expect(identifyToken("")).toBeNull();
    expect(identifyToken("hf_somethingelse")).toBeNull();
  });
});
