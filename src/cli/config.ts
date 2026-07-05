import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { AnthropicProvider } from "../providers/anthropic.js";
import { OpenAIProvider } from "../providers/openai.js";
import { OllamaProvider } from "../providers/ollama.js";
import type { Provider, PromptStyle } from "../types.js";
import type { LangChoice } from "./i18n.js";

export type ProviderName = "anthropic" | "openai" | "ollama" | "custom";

const PROVIDER_NAMES: readonly ProviderName[] = ["anthropic", "openai", "ollama", "custom"];

export function isProviderName(value: unknown): value is ProviderName {
  return PROVIDER_NAMES.includes(value as ProviderName);
}

function toProviderName(value: unknown): ProviderName {
  return isProviderName(value) ? value : "anthropic";
}

export interface CliConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  /** OpenAI-compatible chat-completions endpoint for the `custom` provider. */
  baseUrl?: string;
  /** "auto" mirrors the student's language; "fr"/"en" force it. */
  language?: LangChoice;
}

const CONFIG_DIR = join(homedir(), ".open42");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return { provider: "anthropic" };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as Partial<CliConfig>;
    return {
      provider: toProviderName(raw.provider),
      apiKey: typeof raw.apiKey === "string" ? raw.apiKey : undefined,
      model: typeof raw.model === "string" ? raw.model : undefined,
      baseUrl: typeof raw.baseUrl === "string" ? raw.baseUrl : undefined,
      language: raw.language ?? "auto",
    };
  } catch {
    return { provider: "anthropic", language: "auto" };
  }
}

export function saveConfig(config: CliConfig): void {
  // Owner-only: the directory and file may hold an API key.
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export const CONFIG_PATH = CONFIG_FILE;

/** Forget the saved connection, so the next start shows the connection screen. */
export function clearConfig(): void {
  try {
    if (existsSync(CONFIG_FILE)) rmSync(CONFIG_FILE);
  } catch {
    // Nothing saved, or already gone.
  }
}

/** The environment variable holding the key for a given provider, if any. */
export function envKeyFor(provider: ProviderName): string | undefined {
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  return undefined;
}

/**
 * Resolve the effective key + provider. Environment variables win over the saved
 * config, so a key in the shell is never overridden by a stale file.
 */
export function resolveCredentials(config: CliConfig): CliConfig & { apiKey?: string } {
  const envAnthropic = process.env.ANTHROPIC_API_KEY;
  const envOpenai = process.env.OPENAI_API_KEY;

  if (config.provider === "anthropic" && envAnthropic) {
    return { ...config, apiKey: envAnthropic };
  }
  if (config.provider === "openai" && envOpenai) {
    return { ...config, apiKey: envOpenai };
  }
  // No provider preference yet: take whichever env key exists.
  if (!config.apiKey && envAnthropic) return { provider: "anthropic", apiKey: envAnthropic };
  if (!config.apiKey && envOpenai) return { provider: "openai", apiKey: envOpenai };

  return config;
}

/**
 * A config is ready to run when it has what its provider needs: a local runtime
 * needs nothing, a custom endpoint needs a URL, hosted providers need a key.
 */
export function isConfigured(config: CliConfig): boolean {
  if (config.provider === "ollama") return true;
  if (config.provider === "custom") return Boolean(config.baseUrl);
  return Boolean(config.apiKey);
}

export function createProvider(config: CliConfig): Provider {
  if (config.provider === "ollama") {
    return new OllamaProvider({ model: config.model, baseUrl: config.baseUrl });
  }
  if (config.provider === "custom") {
    if (!config.baseUrl) throw new Error("No endpoint URL configured for the custom provider.");
    // Local endpoints ignore the key; the OpenAI shape still expects one.
    return new OpenAIProvider({
      apiKey: config.apiKey ?? "none",
      model: config.model,
      baseUrl: config.baseUrl,
    });
  }
  if (!config.apiKey) throw new Error("No API key configured.");
  if (config.provider === "anthropic") {
    return new AnthropicProvider({ apiKey: config.apiKey, model: config.model });
  }
  return new OpenAIProvider({ apiKey: config.apiKey, model: config.model });
}

const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i;

/**
 * The prompt style a provider should use. Local small models follow the compact
 * prompt more reliably, so use it for Ollama and any localhost custom endpoint.
 */
export function promptStyleFor(config: Pick<CliConfig, "provider" | "baseUrl">): PromptStyle {
  if (config.provider === "ollama") return "compact";
  if (config.provider === "custom" && config.baseUrl && LOCAL_HOST_PATTERN.test(config.baseUrl)) {
    return "compact";
  }
  return "full";
}
