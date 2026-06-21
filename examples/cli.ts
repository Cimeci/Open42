// A minimal interactive CLI demo of Open42.
//
//   ANTHROPIC_API_KEY=sk-... node --experimental-strip-types examples/cli.ts
//
// Type your question; Open42 routes it to the right mentor, which replies with a
// question, never the answer. Press Ctrl+C to exit.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Open42, AnthropicProvider } from "../dist/index.js";
import type { Message } from "../dist/index.js";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Set ANTHROPIC_API_KEY to run this demo.");
  process.exit(1);
}

const open42 = new Open42({
  provider: new AnthropicProvider({ apiKey }),
  rigor: "strict",
});

const rl = createInterface({ input: stdin, output: stdout });
const transcript: Message[] = [];

console.log("Open42 — your Socratic mentors. They will not give you the answer.\n");

try {
  while (true) {
    const input = (await rl.question("you › ")).trim();
    if (!input) continue;

    transcript.push({ role: "student", content: input });
    const reply = await open42.respond(transcript);
    transcript.push({ role: "mentor", content: reply.content });

    console.log(`\n${reply.mentor} › ${reply.content}\n`);
  }
} finally {
  rl.close();
}
