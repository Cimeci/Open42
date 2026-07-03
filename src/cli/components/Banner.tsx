import { Box, Text } from "ink";
import { BRAND_COLOR } from "../theme.js";
import { strings, type UiLang } from "../i18n.js";

const LOGO = [
  "  ___                  _ _ ___ ",
  " / _ \\ _ __  ___ _ __ | | |_  )",
  "| (_) | '_ \\/ -_) ' \\ |_  _/ / ",
  " \\___/| .__/\\___|_||_|  |_/___|",
  "      |_|",
];

export function Banner({ lang = "en" }: { lang?: UiLang }) {
  const t = strings(lang);
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={BRAND_COLOR}
      paddingX={2}
      paddingY={1}
      marginBottom={1}
    >
      {LOGO.map((line) => (
        <Text key={line} color={BRAND_COLOR} bold>
          {line}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text>
          {t.taglineLead} <Text color={BRAND_COLOR}>{t.taglineEmphasis}</Text>
        </Text>
      </Box>
      <Text color="gray" dimColor>
        mentors: tutor · architect · reviewer · ai-coach · peer-coach
      </Text>
    </Box>
  );
}
