import { describe, it, expect } from "vitest";
import { isConfigured, createProvider } from "./config.js";

describe("config", () => {
  it("treats a local (ollama) provider as configured without a key", () => {
    expect(isConfigured({ provider: "ollama" })).toBe(true);
  });

  it("requires a key for hosted providers", () => {
    expect(isConfigured({ provider: "anthropic" })).toBe(false);
    expect(isConfigured({ provider: "openai", apiKey: "sk-x" })).toBe(true);
  });

  it("builds a keyless provider for ollama", () => {
    const provider = createProvider({ provider: "ollama" });
    expect(provider.name).toBe("ollama");
  });

  it("throws for a hosted provider without a key", () => {
    expect(() => createProvider({ provider: "anthropic" })).toThrow(/No API key/);
  });
});
