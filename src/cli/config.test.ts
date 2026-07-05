import { describe, it, expect } from "vitest";
import { isConfigured, createProvider, promptStyleFor } from "./config.js";

describe("config", () => {
  it("treats a local (ollama) provider as configured without a key", () => {
    expect(isConfigured({ provider: "ollama" })).toBe(true);
  });

  it("requires a key for hosted providers", () => {
    expect(isConfigured({ provider: "anthropic" })).toBe(false);
    expect(isConfigured({ provider: "openai", apiKey: "sk-x" })).toBe(true);
  });

  it("treats a custom provider as configured once it has a base URL (key optional)", () => {
    expect(isConfigured({ provider: "custom" })).toBe(false);
    expect(
      isConfigured({ provider: "custom", baseUrl: "http://localhost:1234/v1/chat/completions" }),
    ).toBe(true);
  });

  it("builds a keyless provider for ollama", () => {
    const provider = createProvider({ provider: "ollama" });
    expect(provider.name).toBe("ollama");
  });

  it("builds a custom provider from a base URL without a key", () => {
    const provider = createProvider({
      provider: "custom",
      baseUrl: "http://localhost:1234/v1/chat/completions",
      model: "local-model",
    });
    expect(typeof provider.complete).toBe("function");
  });

  it("throws for a hosted provider without a key", () => {
    expect(() => createProvider({ provider: "anthropic" })).toThrow(/No API key/);
  });

  it("throws for a custom provider without a base URL", () => {
    expect(() => createProvider({ provider: "custom" })).toThrow(/endpoint URL/i);
  });
});

describe("promptStyleFor", () => {
  it("uses the compact prompt for local models (ollama or a localhost custom endpoint)", () => {
    expect(promptStyleFor({ provider: "ollama" })).toBe("compact");
    expect(
      promptStyleFor({ provider: "custom", baseUrl: "http://localhost:8080/v1/chat/completions" }),
    ).toBe("compact");
  });

  it("uses the full prompt for hosted providers", () => {
    expect(promptStyleFor({ provider: "anthropic" })).toBe("full");
    expect(promptStyleFor({ provider: "openai" })).toBe("full");
    expect(
      promptStyleFor({ provider: "custom", baseUrl: "https://openrouter.ai/api/v1/chat/completions" }),
    ).toBe("full");
  });
});
