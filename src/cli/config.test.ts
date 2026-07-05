import { describe, it, expect, afterEach } from "vitest";
import { isConfigured, createProvider, promptStyleFor, resolveCredentials } from "./config.js";

describe("config", () => {
  it("treats a local (ollama) provider as configured without a key", () => {
    expect(isConfigured({ provider: "ollama" })).toBe(true);
  });

  it("requires a key for hosted providers", () => {
    expect(isConfigured({ provider: "anthropic" })).toBe(false);
    expect(isConfigured({ provider: "openai", apiKey: "sk-x" })).toBe(true);
  });

  it("treats a LOCAL custom endpoint as configured without a key", () => {
    expect(isConfigured({ provider: "custom" })).toBe(false);
    expect(
      isConfigured({ provider: "custom", baseUrl: "http://localhost:1234/v1/chat/completions" }),
    ).toBe(true);
  });

  it("requires a key for a REMOTE custom endpoint (not just a URL)", () => {
    const remote = "https://openrouter.ai/api/v1/chat/completions";
    expect(isConfigured({ provider: "custom", baseUrl: remote })).toBe(false);
    expect(isConfigured({ provider: "custom", baseUrl: remote, apiKey: "sk-or-v1-x" })).toBe(true);
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

describe("resolveCredentials", () => {
  const savedAnthropic = process.env.ANTHROPIC_API_KEY;
  const savedOpenai = process.env.OPENAI_API_KEY;
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  afterEach(() => {
    restore("ANTHROPIC_API_KEY", savedAnthropic);
    restore("OPENAI_API_KEY", savedOpenai);
  });

  it("never hijacks a locally-chosen provider when an env key is present", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-env";
    delete process.env.OPENAI_API_KEY;

    // Ollama stays Ollama and keeps model/language.
    expect(resolveCredentials({ provider: "ollama", model: "llama3.1", language: "fr" })).toEqual({
      provider: "ollama",
      model: "llama3.1",
      language: "fr",
    });
    // Custom stays custom, no key injected.
    const custom = resolveCredentials({
      provider: "custom",
      baseUrl: "http://localhost:1234/v1/chat/completions",
      model: "phi3",
    });
    expect(custom.provider).toBe("custom");
    expect(custom.apiKey).toBeUndefined();
  });

  it("fills a hosted provider from its env key, preserving other fields", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-env";
    expect(
      resolveCredentials({ provider: "anthropic", model: "claude-x", language: "en" }),
    ).toMatchObject({ provider: "anthropic", apiKey: "sk-ant-env", model: "claude-x", language: "en" });
  });

  it("keeps a saved key when no env key is present", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(resolveCredentials({ provider: "openai", apiKey: "sk-saved" }).apiKey).toBe("sk-saved");
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
