import { createRequire } from "node:module";
import { useMemo, useState } from "react";
import { render } from "ink";
import { Open42 } from "../open42.js";
import {
  loadConfig,
  resolveCredentials,
  createProvider,
  saveConfig,
  isConfigured,
  CONFIG_PATH,
  type CliConfig,
  type ProviderName,
} from "./config.js";
import { Onboarding } from "./components/Onboarding.js";
import { Chat } from "./components/Chat.js";
import { MockProvider } from "./mockProvider.js";
import { memoryContextBlock } from "./memory.js";
import { replyLanguageOf, type LangChoice } from "./i18n.js";

const HELP_TEXT = `Open42 - Socratic mentors in your terminal

Usage:
  open42                 start the interactive mentor
  open42 --demo          try the full UI with a fake mentor (no API key)
  open42 --provider <anthropic|openai|ollama>   pick a provider
  open42 --model <name>  pick a model
  open42 --lang <auto|fr|en>   choose the language (default: auto)
  open42 --help          show this help
  open42 --version       show the version

Providers:
  anthropic / openai  hosted models (need an API key).
  ollama              free local models, no key (run e.g. \`ollama run llama3.1\`).
  On first run, Open42 asks which one you want and adapts.

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
  return value === "anthropic" || value === "openai" || value === "ollama" ? value : undefined;
}

function ChatFlow({ config, onConfig }: { config: CliConfig; onConfig: (c: CliConfig) => void }) {
  const open42 = useMemo(
    () =>
      new Open42({
        provider: createProvider(config),
        language: replyLanguageOf(config.language ?? "auto"),
        memory: memoryContextBlock(),
        // Small local models follow the compact prompt more reliably.
        promptStyle: config.provider === "ollama" ? "compact" : "full",
      }),
    // Built once; language changes are applied live via open42.setLanguage.
    [],
  );
  return (
    <Chat
      open42={open42}
      initialLang={config.language ?? "auto"}
      localHint={config.provider === "ollama"}
      onLanguageChange={(choice) => {
        const next = { ...config, language: choice };
        onConfig(next);
        saveConfig(next);
      }}
    />
  );
}

function Root({ initial }: { initial: CliConfig }) {
  const [config, setConfig] = useState<CliConfig>(initial);
  if (!isConfigured(config)) {
    return <Onboarding initialLang={config.language ?? "auto"} onDone={setConfig} />;
  }
  return <ChatFlow config={config} onConfig={setConfig} />;
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

  const langArg = parseLangArg(args);
  const providerArg = parseProviderArg(args);
  const modelArg = flagValue(args, "--model");

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
    ...(langArg ? { language: langArg } : {}),
  };

  if (!isConfigured(config) && !process.stdin.isTTY) {
    console.error(
      "No provider configured. Set ANTHROPIC_API_KEY / OPENAI_API_KEY, pass --provider ollama for local, or run open42 in an interactive terminal.",
    );
    process.exitCode = 1;
    return;
  }

  render(<Root initial={config} />, { exitOnCtrlC: false });
}

main();
