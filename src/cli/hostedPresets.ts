// Known hosted services the user can connect to with an API key. Anthropic and
// OpenAI have their own providers; NVIDIA and OpenRouter are OpenAI-compatible,
// so they map onto the `custom` provider with a preset base URL. Each preset
// carries the page where the user grabs a key (opened in the browser).

import type { CliConfig, ProviderName } from "./config.js";
import type { LangChoice } from "./i18n.js";

export interface HostedPreset {
  readonly id: string;
  readonly label: string;
  readonly provider: ProviderName;
  /** OpenAI-compatible chat-completions URL (custom presets only). */
  readonly baseUrl?: string;
  /** Model to use out of the box (custom presets need one). */
  readonly defaultModel?: string;
  /** The page where the user creates/copies a key. Opened in the browser. */
  readonly keyUrl: string;
  /** Sample key prefix, shown as a hint. */
  readonly keyHint: string;
  /** Literal key prefix used to auto-detect the provider from a pasted token. */
  readonly keyPrefix: string;
}

export const HOSTED_PRESETS: readonly HostedPreset[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    provider: "anthropic",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-…",
    keyPrefix: "sk-ant-",
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    provider: "openai",
    keyUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-…",
    keyPrefix: "sk-",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    provider: "custom",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    keyUrl: "https://openrouter.ai/keys",
    keyHint: "sk-or-v1-…",
    keyPrefix: "sk-or-v1-",
  },
  {
    id: "nvidia",
    label: "NVIDIA — free API keys",
    provider: "custom",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "meta/llama-3.1-8b-instruct",
    keyUrl: "https://build.nvidia.com",
    keyHint: "nvapi-…",
    keyPrefix: "nvapi-",
  },
  {
    id: "groq",
    label: "Groq",
    provider: "custom",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.1-8b-instant",
    keyUrl: "https://console.groq.com/keys",
    keyHint: "gsk_…",
    keyPrefix: "gsk_",
  },
];

/**
 * Identify the hosted service from a pasted token by its prefix. Longer (more
 * specific) prefixes win, so `sk-or-v1-…` matches OpenRouter before OpenAI's
 * generic `sk-`. Returns null when no known prefix matches.
 */
export function identifyToken(rawKey: string): HostedPreset | null {
  const key = rawKey.trim();
  if (!key) return null;
  const byPrefixLength = [...HOSTED_PRESETS].sort(
    (a, b) => b.keyPrefix.length - a.keyPrefix.length,
  );
  return byPrefixLength.find((preset) => key.startsWith(preset.keyPrefix)) ?? null;
}

/** Build the config to save once the user has pasted a key for a preset. */
export function configForPreset(
  preset: HostedPreset,
  apiKey: string,
  language: LangChoice,
): CliConfig {
  return {
    provider: preset.provider,
    apiKey,
    model: preset.defaultModel,
    baseUrl: preset.provider === "custom" ? preset.baseUrl : undefined,
    language,
  };
}
