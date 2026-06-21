// Renders the onboarding provider-selection screen to text (no TTY, no key).
//   npm run build && node examples/onboarding-preview.mjs

import React from "react";
import { render } from "ink-testing-library";
import { Onboarding } from "../dist/cli/components/Onboarding.js";

for (const lang of ["fr", "en"]) {
  const { lastFrame } = render(
    React.createElement(Onboarding, { onDone: () => {}, initialLang: lang }),
  );
  console.log(`\n========== onboarding initialLang="${lang}" ==========`);
  console.log(lastFrame());
}
process.exit(0);
