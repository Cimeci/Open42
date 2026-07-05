import { describe, it, expect } from "vitest";
import { parseModelCommand, planModelSwitch } from "./modelCommand.js";
import type { CliConfig } from "./config.js";

describe("parseModelCommand", () => {
  it("returns null with no argument (show status)", () => {
    expect(parseModelCommand("", "anthropic")).toBeNull();
    expect(parseModelCommand(undefined, "ollama")).toBeNull();
  });

  it("reads a provider as the first token, model as the second", () => {
    expect(parseModelCommand("ollama qwen2.5-coder", "anthropic")).toEqual({
      provider: "ollama",
      model: "qwen2.5-coder",
      providerChanged: true,
    });
  });

  it("treats a lone non-provider token as a model for the current provider", () => {
    expect(parseModelCommand("gpt-4o-mini", "openai")).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
      providerChanged: false,
    });
  });

  it("flags providerChanged=false when re-selecting the current provider", () => {
    expect(parseModelCommand("anthropic", "anthropic")?.providerChanged).toBe(false);
  });
});

describe("planModelSwitch", () => {
  const anthropicKey = () => "sk-ant-xxx";
  const noKey = () => undefined;

  it("returns status when there is no argument", () => {
    const cfg: CliConfig = { provider: "anthropic", apiKey: "sk-ant-1" };
    expect(planModelSwitch(cfg, "", anthropicKey)).toEqual({ kind: "status" });
  });

  it("changes only the model on the current provider, keeping the key", () => {
    const cfg: CliConfig = { provider: "openai", apiKey: "sk-openai", model: "gpt-4o" };
    const result = planModelSwitch(cfg, "gpt-4o-mini", noKey);
    expect(result).toEqual({
      kind: "switch",
      config: { provider: "openai", apiKey: "sk-openai", model: "gpt-4o-mini", baseUrl: undefined },
    });
  });

  it("does not carry a key across a provider change (uses the env key of the target)", () => {
    const cfg: CliConfig = { provider: "anthropic", apiKey: "sk-ant-1" };
    const lookup = (p: string) => (p === "openai" ? "sk-openai-env" : undefined);
    const result = planModelSwitch(cfg, "openai", lookup);
    expect(result).toMatchObject({ kind: "switch" });
    if (result.kind === "switch") {
      expect(result.config.provider).toBe("openai");
      expect(result.config.apiKey).toBe("sk-openai-env");
    }
  });

  it("errors when switching to a hosted provider with no key available", () => {
    const cfg: CliConfig = { provider: "ollama" };
    expect(planModelSwitch(cfg, "anthropic", noKey)).toEqual({
      kind: "error",
      reason: "needs-key",
      provider: "anthropic",
    });
  });

  it("switches to a local provider without needing a key", () => {
    const cfg: CliConfig = { provider: "anthropic", apiKey: "sk-ant-1" };
    const result = planModelSwitch(cfg, "ollama llama3.1", noKey);
    expect(result).toMatchObject({ kind: "switch" });
    if (result.kind === "switch") {
      expect(result.config).toMatchObject({ provider: "ollama", model: "llama3.1", apiKey: undefined });
    }
  });

  it("errors when switching to custom without a base URL", () => {
    const cfg: CliConfig = { provider: "anthropic", apiKey: "sk-ant-1" };
    expect(planModelSwitch(cfg, "custom", noKey)).toEqual({
      kind: "error",
      reason: "needs-base-url",
      provider: "custom",
    });
  });

  it("keeps the base URL when changing the model on a custom endpoint", () => {
    const cfg: CliConfig = {
      provider: "custom",
      baseUrl: "http://localhost:1234/v1/chat/completions",
      model: "a",
    };
    const result = planModelSwitch(cfg, "b", noKey);
    expect(result).toMatchObject({ kind: "switch" });
    if (result.kind === "switch") {
      expect(result.config).toMatchObject({
        provider: "custom",
        model: "b",
        baseUrl: "http://localhost:1234/v1/chat/completions",
      });
    }
  });
});
