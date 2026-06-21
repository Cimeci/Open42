// Open42 CLI configuration: API key + provider, persisted to ~/.open42/config.json.

import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { AnthropicProvider } from "../providers/anthropic.js";
import { OpenAIProvider } from "../providers/openai.js";
import { OllamaProvider } from "../providers/ollama.js";
import type { Provider } from "../types.js";
import type { LangChoice } from "./i18n.js";

export type ProviderName = "anthropic" | "openai" | "ollama";

export interface CliConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
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
      provider: raw.provider ?? "anthropic",
      apiKey: raw.apiKey,
      model: raw.model,
      language: raw.language ?? "auto",
    };
  } catch {
    return { provider: "anthropic", language: "auto" };
  }
}

export function saveConfig(config: CliConfig): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  // Owner-only permissions: the file holds an API key.
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export const CONFIG_PATH = CONFIG_FILE;

/** Guess the provider from an API key's shape. */
export function inferProvider(apiKey: string): ProviderName {
  return apiKey.startsWith("sk-ant") ? "anthropic" : "openai";
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

/** A config is ready to run when it has a key, or uses a local provider. */
export function isConfigured(config: CliConfig): boolean {
  return config.provider === "ollama" || Boolean(config.apiKey);
}

export function createProvider(config: CliConfig): Provider {
  if (config.provider === "ollama") {
    return new OllamaProvider({ model: config.model });
  }
  if (!config.apiKey) throw new Error("No API key configured.");
  if (config.provider === "anthropic") {
    return new AnthropicProvider({ apiKey: config.apiKey, model: config.model });
  }
  return new OpenAIProvider({ apiKey: config.apiKey, model: config.model });
}
