// Offline test/inspection of Open42 — no API key needed.
// Shows (1) the available mentors, (2) how the router dispatches different
// student messages, and (3) what each mentor's system prompt contains, using a
// fake provider that captures the request.
//
//   npm run build && node examples/inspect.mjs

import { Open42 } from "../dist/index.js";

// A fake provider: never calls a model. Records what it received and returns a
// canned mentor-style reply, so we can inspect the harness in full.
class CapturingProvider {
  name = "capture";
  lastRequest = null;
  async complete(request) {
    this.lastRequest = request;
    return { content: "[the mentor's question would be generated here]" };
  }
}

const provider = new CapturingProvider();
const open42 = new Open42({ provider, rigor: "strict" });
const line = (c = "─") => console.log(c.repeat(72));

// 1) The mentors (sub-agents) ---------------------------------------------
line("═");
console.log("1) MENTORS DISPONIBLES (sous-agents)");
line("═");
for (const m of open42.listMentors()) console.log(`  ${m.id.padEnd(10)} — ${m.title}`);

// 2) Routing: same harness, different mentors -----------------------------
line("═");
console.log("2) ROUTAGE AUTOMATIQUE SELON LA QUESTION");
line("═");
const samples = [
  "Ma fonction récursive renvoie undefined, je comprends pas pourquoi.",
  "Je devrais utiliser quel pattern pour structurer mon architecture ?",
  "Tu peux relire mon code et me dire s'il est propre ?",
  "Comment je vérifie que le code généré par ChatGPT est correct ?",
];
for (const text of samples) {
  const reply = await open42.respond([{ role: "student", content: text }]);
  console.log(`  « ${text.slice(0, 50)}… »\n    → mentor: ${reply.mentor}\n`);
}

// 3) Inspect one mentor's composed prompt ---------------------------------
line("═");
console.log("3) GARDE-FOUS PRÉSENTS DANS CHAQUE MENTOR");
line("═");
for (const m of open42.listMentors()) {
  const sys = open42.promptFor(m.id);
  const checks = {
    "compréhension d'abord": sys.includes("Never just hand over an answer to copy."),
    "pilier indépendance IA": sys.includes("Using AI without depending on it"),
    "méthode socratique": sys.includes("The Socratic loop"),
  };
  const status = Object.entries(checks)
    .map(([k, v]) => `${v ? "✅" : "❌"} ${k}`)
    .join("   ");
  console.log(`  ${m.id.padEnd(10)} ${status}`);
}

// 4) Custom mentor (extensible architecture) ------------------------------
line("═");
console.log("4) MENTOR PERSONNALISÉ (architecture extensible)");
line("═");
open42.registerMentor({
  id: "sec-coach",
  title: "Security Coach",
  description: "Helps you find security issues in your own code.",
  domains: ["review"],
  routeKeywords: ["security", "vulnerability", "injection"],
});
const r = await open42.respond(
  [{ role: "student", content: "Is there a security vulnerability in my login code?" }],
);
console.log(`  Nouveau mentor enregistré et routé : ${r.mentor}`);
