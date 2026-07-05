import { createRequire } from "node:module";
import { useMemo, useState } from "react";
import { render } from "ink";
import { Open42 } from "../open42.js";
import {
  loadConfig,
  resolveCredentials,
  createProvider,
  saveConfig,
  clearConfig,
  isConfigured,
  isProviderName,
  promptStyleFor,
  CONFIG_PATH,
  type CliConfig,
  type ProviderName,
} from "./config.js";
import { Onboarding } from "./components/Onboarding.js";
import { Chat } from "./components/Chat.js";
import { MockProvider } from "./mockProvider.js";
import { memoryContextBlock } from "./memory.js";
import { composePromptMemory, getProjectContext } from "./projectContext.js";
import { replyLanguageOf, type LangChoice } from "./i18n.js";

const HELP_TEXT = `Open42 - Socratic mentors in your terminal

Usage:
  open42                 start the interactive mentor
  open42 --demo          try the full UI with a fake mentor (no API key)
  open42 --provider <anthropic|openai|ollama|custom>   pick a provider
  open42 --model <name>  pick a model
  open42 --base-url <url>   OpenAI-compatible endpoint (for --provider custom)
  open42 --lang <auto|fr|en>   choose the language (default: auto)
  open42 --logout        forget the saved connection (back to the connect screen)
  open42 --help          show this help
  open42 --version       show the version

Providers:
  anthropic / openai  hosted models (need an API key).
  ollama              free local models, no key (run e.g. \`ollama run llama3.1\`).
  custom              any OpenAI-compatible endpoint (LM Studio, vLLM, OpenRouter,
                      a self-hosted server…) via --base-url.
  On first run, Open42 asks which one you want and adapts. In session, /model
  switches provider or model on the fly.

Configuration:
  Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment, or paste a key on
  first run. The config is saved to ${CONFIG_PATH} (chmod 600).`;

function flagValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function parseLangArg(args: string[]): LangChoice | undefined {
  const value = flagValue(args, "--lang");
  return value === "auto" || value === "fr" || value === "en" ? value : undefined;
}

function parseProviderArg(args: string[]): ProviderName | undefined {
  const value = flagValue(args, "--provider");
  return value !== undefined && isProviderName(value) ? value : undefined;
}

function ChatFlow({
  config,
  onConfig,
  onReconnect,
}: {
  config: CliConfig;
  onConfig: (c: CliConfig) => void;
  onReconnect: () => void;
}) {
  const memory = composePromptMemory(memoryContextBlock(), getProjectContext());
  const open42 = useMemo(
    () =>
      new Open42({
        provider: createProvider(config),
        language: replyLanguageOf(config.language ?? "auto"),
        memory,
        // Small local models follow the compact prompt more reliably.
        promptStyle: promptStyleFor(config),
      }),
    // Built once; provider/language changes are applied live via open42.setProvider/setLanguage.
    [],
  );
  const persist = (next: CliConfig) => {
    onConfig(next);
    saveConfig(next);
  };
  return (
    <Chat
      open42={open42}
      config={config}
      initialLang={config.language ?? "auto"}
      localHint={config.provider === "ollama"}
      onLanguageChange={(choice) => persist({ ...config, language: choice })}
      onConfigChange={persist}
      onLogout={() => {
        clearConfig();
        // Reset to an unconfigured state so Root shows the connection screen again.
        onConfig({ provider: "anthropic", language: config.language });
      }}
      onReconnect={onReconnect}
    />
  );
}

function Root({ initial }: { initial: CliConfig }) {
  const [config, setConfig] = useState<CliConfig>(initial);
  // `/model` reopens the connection screen without dropping the saved config.
  const [reconnecting, setReconnecting] = useState(false);
  if (reconnecting || !isConfigured(config)) {
    return (
      <Onboarding
        initialLang={config.language ?? "auto"}
        onDone={(next) => {
          setConfig(next);
          setReconnecting(false);
        }}
      />
    );
  }
  return (
    <ChatFlow config={config} onConfig={setConfig} onReconnect={() => setReconnecting(true)} />
  );
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    const { version } = createRequire(import.meta.url)("../../package.json") as { version: string };
    console.log(`open42 ${version}`);
    return;
  }
  if (args.includes("--logout")) {
    clearConfig();
    console.log("Disconnected. Run open42 to connect an AI again.");
    return;
  }

  const langArg = parseLangArg(args);
  const providerArg = parseProviderArg(args);
  const modelArg = flagValue(args, "--model");
  const baseUrlArg = flagValue(args, "--base-url");

  if (args.includes("--demo")) {
    const lang = langArg ?? "en";
    const open42 = new Open42({ provider: new MockProvider(), language: replyLanguageOf(lang) });
    render(<Chat open42={open42} demo initialLang={lang} />, { exitOnCtrlC: false });
    return;
  }

  const config: CliConfig = {
    ...resolveCredentials(loadConfig()),
    ...(providerArg ? { provider: providerArg } : {}),
    ...(modelArg ? { model: modelArg } : {}),
    ...(baseUrlArg ? { baseUrl: baseUrlArg } : {}),
    ...(langArg ? { language: langArg } : {}),
  };

  if (config.provider === "custom" && !config.baseUrl) {
    console.error(
      "The custom provider needs an endpoint: pass --base-url <url> (an OpenAI-compatible chat-completions URL).",
    );
    process.exitCode = 1;
    return;
  }

  if (!isConfigured(config) && !process.stdin.isTTY) {
    console.error(
      "No provider configured. Set ANTHROPIC_API_KEY / OPENAI_API_KEY, pass --provider ollama for local, --provider custom --base-url <url>, or run open42 in an interactive terminal.",
    );
    process.exitCode = 1;
    return;
  }

  render(<Root initial={config} />, { exitOnCtrlC: false });
}

main();
