// Pure parsing/planning for the in-session `/model` command, kept free of Ink so
// it can be unit-tested. The Chat component wires the side effects (detecting
// local runtimes, building the provider, persisting) around these decisions.

import { isProviderName, type CliConfig, type ProviderName } from "./config.js";

export interface ParsedModelCommand {
  readonly provider: ProviderName;
  readonly model?: string;
  readonly providerChanged: boolean;
}

/**
 * Interpret the argument of `/model`. The first token is a provider when it names
 * one (`anthropic|openai|ollama|custom`); otherwise it is taken as a model name
 * for the current provider. Returns null when there is no argument (show status).
 */
export function parseModelCommand(
  arg: string | undefined,
  current: ProviderName,
): ParsedModelCommand | null {
  const tokens = (arg ?? "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const [first, ...rest] = tokens;
  if (isProviderName(first)) {
    return { provider: first, model: rest[0], providerChanged: first !== current };
  }
  return { provider: current, model: first, providerChanged: false };
}

export type ModelSwitch =
  | { readonly kind: "status" }
  | { readonly kind: "switch"; readonly config: CliConfig }
  | { readonly kind: "error"; readonly reason: "needs-key" | "needs-base-url"; readonly provider: ProviderName };

/**
 * Decide what a `/model <arg>` invocation should do, given the current config and
 * a way to look up an env key for a target provider. A credential/URL is never
 * carried across a provider change, so switching to a hosted provider requires
 * its own key (from the environment) and `custom` requires a base URL.
 */
export function planModelSwitch(
  current: CliConfig,
  arg: string | undefined,
  lookupEnvKey: (provider: ProviderName) => string | undefined,
): ModelSwitch {
  const parsed = parseModelCommand(arg, current.provider);
  if (!parsed) return { kind: "status" };

  const sameProvider = !parsed.providerChanged;
  const apiKey = sameProvider ? current.apiKey : lookupEnvKey(parsed.provider);
  const baseUrl = sameProvider ? current.baseUrl : undefined;
  const model = parsed.model ?? (sameProvider ? current.model : undefined);

  const config: CliConfig = { ...current, provider: parsed.provider, model, apiKey, baseUrl };

  if (parsed.provider === "custom" && !config.baseUrl) {
    return { kind: "error", reason: "needs-base-url", provider: "custom" };
  }
  if ((parsed.provider === "anthropic" || parsed.provider === "openai") && !config.apiKey) {
    return { kind: "error", reason: "needs-key", provider: parsed.provider };
  }
  return { kind: "switch", config };
}
