import { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Banner } from "./Banner.js";
import { saveConfig, type CliConfig, type ProviderName } from "../config.js";
import { strings, uiLangOf, type LangChoice } from "../i18n.js";

const LANG_CYCLE: LangChoice[] = ["auto", "fr", "en"];

export function Onboarding({
  onDone,
  initialLang = "auto",
}: {
  onDone: (config: CliConfig) => void;
  initialLang?: LangChoice;
}) {
  const [phase, setPhase] = useState<"provider" | "key">("provider");
  const [selected, setSelected] = useState(0);
  const [provider, setProvider] = useState<ProviderName>("anthropic");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<LangChoice>(initialLang);

  const uiLang = uiLangOf(choice);
  const t = strings(uiLang);
  const langLabel = choice === "auto" ? t.langAutoLabel : choice;

  const PROVIDERS: Array<{ id: ProviderName; label: string }> = [
    { id: "anthropic", label: t.providerAnthropic },
    { id: "openai", label: t.providerOpenAI },
    { id: "ollama", label: t.providerLocal },
  ];

  const finishLocal = () => {
    const config: CliConfig = { provider: "ollama", language: choice };
    saveConfig(config);
    onDone(config);
  };

  const submitKey = (raw: string) => {
    const apiKey = raw.trim();
    if (!apiKey) {
      setError(t.emptyKeyError);
      return;
    }
    const config: CliConfig = { provider, apiKey, language: choice };
    saveConfig(config);
    onDone(config);
  };

  useInput((_char, key) => {
    if (key.tab) {
      setChoice((c) => LANG_CYCLE[(LANG_CYCLE.indexOf(c) + 1) % LANG_CYCLE.length]!);
      return;
    }
    if (phase !== "provider") return;
    if (key.upArrow) setSelected((s) => (s + PROVIDERS.length - 1) % PROVIDERS.length);
    else if (key.downArrow) setSelected((s) => (s + 1) % PROVIDERS.length);
    else if (key.return) {
      const picked = PROVIDERS[selected]!;
      setProvider(picked.id);
      if (picked.id === "ollama") finishLocal();
      else setPhase("key");
    }
  });

  return (
    <Box flexDirection="column">
      <Banner lang={uiLang} />

      {phase === "provider" ? (
        <Box flexDirection="column">
          <Text>{t.providerQuestion}</Text>
          {PROVIDERS.map((p, i) => (
            <Text key={p.id} color={i === selected ? "cyanBright" : undefined}>
              {i === selected ? "❯ " : "  "}
              {p.label}
            </Text>
          ))}
          <Box marginTop={1} flexDirection="column">
            <Text color="gray" dimColor>
              {t.selectHint}
            </Text>
            <Text color="gray">{t.langPickHint(langLabel)}</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text>{t.onboardingTitle}</Text>
          <Text color="gray" dimColor>
            {t.onboardingHint}
          </Text>
          <Box marginTop={1}>
            <Text color="cyanBright">{t.keyLabel} › </Text>
            <TextInput value={value} onChange={setValue} onSubmit={submitKey} mask="*" />
          </Box>
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}
    </Box>
  );
}
