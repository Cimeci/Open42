// Pedagogical eval runner.
//   npm run eval
//
// Structural evals run with no model. Behavioural evals need a real model:
//   ANTHROPIC_API_KEY=...  npm run eval
//   OPENAI_API_KEY=...     npm run eval
//   OLLAMA_MODEL=qwen2.5:7b npm run eval   (free, local)

import {
  runStructuralEvals,
  runBehaviouralEvals,
  Open42,
  AnthropicProvider,
  OpenAIProvider,
  OllamaProvider,
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
const ollama = process.env.OLLAMA_MODEL;

let provider;
let promptStyle = "full";
if (anthropic) provider = new AnthropicProvider({ apiKey: anthropic });
else if (openai) provider = new OpenAIProvider({ apiKey: openai });
else if (ollama) {
  provider = new OllamaProvider({ model: ollama });
  promptStyle = "compact";
}

if (provider) {
  console.log(`\nBEHAVIOURAL (real model: ${provider.name}${ollama ? ` ${ollama}` : ""})`);
  const open42 = new Open42({ provider, promptStyle });
  const behavioural = await runBehaviouralEvals(open42, (scenario, reply, checks) => {
    console.log(`\n• ${scenario.id}`);
    console.log(`  student: ${scenario.input}`);
    console.log(`  mentor : ${reply.replace(/\s+/g, " ").trim().slice(0, 240)}`);
    for (const c of checks) {
      console.log(`    ${c.ok ? "✓" : "✗"} ${c.id.split("/").pop()}${c.ok ? "" : `  - ${c.detail}`}`);
    }
  });
  printReport("BEHAVIOURAL summary", behavioural);
  failed += behavioural.failed;
} else {
  console.log(
    "\nBEHAVIOURAL  (skipped) - set ANTHROPIC_API_KEY, OPENAI_API_KEY, or OLLAMA_MODEL to run against a real model.",
  );
}

console.log(failed === 0 ? "\nAll evals passed." : `\n${failed} eval(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
