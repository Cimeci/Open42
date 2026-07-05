import { useEffect, useState, type ReactNode } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Banner } from "./Banner.js";
import { saveConfig, type CliConfig } from "../config.js";
import { strings, uiLangOf, type LangChoice } from "../i18n.js";
import { HOSTED_PRESETS, configForPreset, identifyToken } from "../hostedPresets.js";
import { openBrowser } from "../openBrowser.js";
import { authorizeWithOpenRouter } from "../openrouterOAuth.js";
import { detectLocalModels } from "../../providers/localModels.js";

const LANG_CYCLE: LangChoice[] = ["auto", "fr", "en"];

type Phase = "provider" | "token" | "web" | "local";

const OPENROUTER = HOSTED_PRESETS.find((p) => p.id === "openrouter")!;

export function Onboarding({
  onDone,
  initialLang = "auto",
}: {
  onDone: (config: CliConfig) => void;
  initialLang?: LangChoice;
}) {
  const [phase, setPhase] = useState<Phase>("provider");
  const [selected, setSelected] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<LangChoice>(initialLang);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);

  const uiLang = uiLangOf(choice);
  const t = strings(uiLang);
  const langLabel = choice === "auto" ? t.langAutoLabel : choice;

  const MENU = [
    { id: "token" as const, label: t.connectPasteToken },
    { id: "web" as const, label: t.connectWeb },
    { id: "local" as const, label: t.useLocal },
  ];

  const finish = (config: CliConfig) => {
    saveConfig(config);
    onDone(config);
  };

  // Web sign-in: OpenRouter OAuth. Open the browser, wait for the key to come back.
  useEffect(() => {
    if (phase !== "web") return;
    const controller = new AbortController();
    let active = true;
    setWebUrl(null);
    setWebError(null);
    authorizeWithOpenRouter({
      openBrowser,
      onUrl: (url) => active && setWebUrl(url),
      signal: controller.signal,
    })
      .then((key) => active && finish(configForPreset(OPENROUTER, key, choice)))
      .catch((err) => active && setWebError(err instanceof Error ? err.message : String(err)));
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Local: detect a running model silently and connect to the first one.
  useEffect(() => {
    if (phase !== "local") return;
    let active = true;
    detectLocalModels().then((models) => {
      if (!active) return;
      const first = models[0];
      finish(
        first
          ? first.runtime === "ollama"
            ? { provider: "ollama", model: first.model, language: choice }
            : { provider: "custom", model: first.model, baseUrl: first.chatUrl, language: choice }
          : { provider: "ollama", model: "llama3.1", language: choice },
      );
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pickMain = () => {
    setError(null);
    setValue("");
    setWebUrl(null);
    setWebError(null);
    setPhase(MENU[selected]!.id);
  };

  const submitToken = (raw: string) => {
    const preset = identifyToken(raw);
    if (!preset) {
      setError(t.tokenUnknown);
      return;
    }
    finish(configForPreset(preset, raw.trim(), choice));
  };

  useInput((_char, key) => {
    if (key.tab) {
      setChoice((c) => LANG_CYCLE[(LANG_CYCLE.indexOf(c) + 1) % LANG_CYCLE.length]!);
      return;
    }
    // After a failed web sign-in, Enter returns to the menu.
    if (phase === "web" && webError && key.return) {
      setWebError(null);
      setSelected(0);
      setPhase("provider");
      return;
    }
    if (phase !== "provider") return;
    if (key.upArrow) setSelected((s) => (s + MENU.length - 1) % MENU.length);
    else if (key.downArrow) setSelected((s) => (s + 1) % MENU.length);
    else if (key.return) pickMain();
  });

  return (
    <Box flexDirection="column">
      <Banner lang={uiLang} />

      {phase === "provider" && (
        <Menu title={t.connectTitle} items={MENU.map((m) => m.label)} selected={selected}>
          <Text color="gray" dimColor>
            {t.selectHint}
          </Text>
          <Text color="gray">{t.langPickHint(langLabel)}</Text>
        </Menu>
      )}

      {phase === "token" && (
        <Box flexDirection="column">
          <Text>{t.tokenPrompt}</Text>
          <Box marginTop={1}>
            <Text color="cyanBright">{t.keyLabel} › </Text>
            <TextInput value={value} onChange={setValue} onSubmit={submitToken} mask="*" />
          </Box>
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}

      {phase === "web" &&
        (webError ? (
          <Box flexDirection="column">
            <Text color="red">{t.webError(webError)}</Text>
            <Text color="gray" dimColor>
              {t.webRetryHint}
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text color="cyan">{t.webOpening}</Text>
            {webUrl && (
              <Text color="gray" dimColor>
                {t.webUrlFallback(webUrl)}
              </Text>
            )}
          </Box>
        ))}

      {phase === "local" && <Text color="gray">{t.localConnecting}</Text>}
    </Box>
  );
}

function Menu({
  title,
  items,
  selected,
  children,
}: {
  title: string;
  items: string[];
  selected: number;
  children?: ReactNode;
}) {
  return (
    <Box flexDirection="column">
      <Text>{title}</Text>
      {items.map((label, i) => (
        <Text key={label} color={i === selected ? "cyanBright" : undefined}>
          {i === selected ? "❯ " : "  "}
          {label}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}
