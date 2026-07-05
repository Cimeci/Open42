import { useEffect, useState, type ReactNode } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Banner } from "./Banner.js";
import { saveConfig, type CliConfig } from "../config.js";
import { strings, uiLangOf, type LangChoice } from "../i18n.js";
import { configForPreset, identifyToken } from "../hostedPresets.js";
import { detectLocalModels } from "../../providers/localModels.js";
import { DEFAULT_OLLAMA_MODEL } from "../../providers/ollama.js";

const LANG_CYCLE: LangChoice[] = ["auto", "fr", "en"];

type Phase = "provider" | "token" | "local";

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

  const uiLang = uiLangOf(choice);
  const t = strings(uiLang);
  const langLabel = choice === "auto" ? t.langAutoLabel : choice;

  const MENU = [
    { id: "token" as const, label: t.connectPasteToken },
    { id: "local" as const, label: t.useLocal },
  ];

  const finish = (config: CliConfig) => {
    saveConfig(config);
    onDone(config);
  };

  // Local: detect a running model silently and connect to the first one.
  useEffect(() => {
    if (phase !== "local") return;
    let active = true;
    const fallback = (): CliConfig => ({
      provider: "ollama",
      model: DEFAULT_OLLAMA_MODEL,
      language: choice,
    });
    detectLocalModels()
      .then((models) => {
        if (!active) return;
        const first = models[0];
        finish(
          first
            ? first.runtime === "ollama"
              ? { provider: "ollama", model: first.model, language: choice }
              : { provider: "custom", model: first.model, baseUrl: first.chatUrl, language: choice }
            : fallback(),
        );
      })
      // detectLocalModels is documented never to reject, but stay defensive:
      // an unhandled rejection would crash the process instead of degrading.
      .catch(() => {
        if (active) finish(fallback());
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pickMain = () => {
    setError(null);
    setValue("");
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
