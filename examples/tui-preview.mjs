// Renders the real Chat TUI to text (no TTY, no API key) so you can see the look,
// in both languages. Uses the same MockProvider as `npm run demo`.
//   npm run build && node examples/tui-preview.mjs

import React from "react";
import { render } from "ink-testing-library";
import { Chat } from "../dist/cli/components/Chat.js";
import { MockProvider } from "../dist/cli/mockProvider.js";
import { replyLanguageOf } from "../dist/cli/i18n.js";
import { Open42 } from "../dist/index.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function preview(lang, question) {
  const open42 = new Open42({ provider: new MockProvider(0), language: replyLanguageOf(lang) });
  const { lastFrame, stdin } = render(
    React.createElement(Chat, { open42, demo: true, initialLang: lang }),
  );
  await wait(60);
  stdin.write(question);
  await wait(60);
  stdin.write("\r");
  await wait(300);
  console.log(`\n========== initialLang="${lang}" ==========`);
  console.log(lastFrame());
}

await preview("fr", "Ma fonction récursive renvoie undefined, je comprends pas pourquoi.");
await preview("en", "My recursive function returns undefined and I don't know why.");
process.exit(0);
