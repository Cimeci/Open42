// Pedagogical eval runner.
//   npm run eval
//
// Structural evals run with no key. Behavioural evals run only if a provider key
// is set (ANTHROPIC_API_KEY or OPENAI_API_KEY), since they need a real model.

import {
  runStructuralEvals,
  runBehaviouralEvals,
  Open42,
  AnthropicProvider,
  OpenAIProvider,
} from "../dist/index.js";

function printReport(title, report) {
  console.log(`\n${title}  (${report.passed}/${report.total})`);
  for (const r of report.results) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.id}${r.ok ? "" : `  - ${r.detail}`}`);
  }
}

const structural = runStructuralEvals();
printReport("STRUCTURAL", structural);

let failed = structural.failed;

const anthropic = process.env.ANTHROPIC_API_KEY;
const openai = process.env.OPENAI_API_KEY;
if (anthropic || openai) {
  const provider = anthropic
    ? new AnthropicProvider({ apiKey: anthropic })
    : new OpenAIProvider({ apiKey: openai });
  const open42 = new Open42({ provider });
  const behavioural = await runBehaviouralEvals(open42);
  printReport("BEHAVIOURAL (real model)", behavioural);
  failed += behavioural.failed;
} else {
  console.log(
    "\nBEHAVIOURAL  (skipped) - set ANTHROPIC_API_KEY or OPENAI_API_KEY to run against a real model.",
  );
}

console.log(failed === 0 ? "\nAll evals passed." : `\n${failed} eval(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
