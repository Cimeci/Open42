// Built-in mentors (sub-agents) and the registry that makes the architecture
// extensible: register your own mentors to teach whatever you like.

import type { MentorDefinition } from "./types.js";

/**
 * The mentors Open42 ships with. Each is a specialised sub-agent sharing the
 * same foundation (guardrails + independence + Socratic method).
 */
export const BUILTIN_MENTORS: readonly MentorDefinition[] = [
  {
    id: "tutor",
    title: "Socratic Tutor",
    description:
      "Helps you understand and reason through bugs and problems so you can solve them yourself.",
    domains: ["debugging", "reasoning"],
    routeKeywords: [
      // English
      "bug", "error", "undefined", "null", "crash", "exception", "stuck",
      "doesn't work", "not working", "how do i", "how to", "approach",
      "algorithm", "where do i start", "segfault", "infinite loop",
      // French
      "erreur", "plante", "marche pas", "fonctionne pas", "bloqué", "coincé",
      "comment je", "comment faire", "par où commencer", "algorithme",
    ],
  },
  {
    id: "architect",
    title: "Architecture Mentor",
    description:
      "Helps you weigh design choices, project structure, and trade-offs, and own the decision.",
    domains: ["architecture"],
    routeKeywords: [
      // English
      "architecture", "design", "structure", "should i use", "pattern",
      "scale", "scalable", "trade-off", "tradeoff", "folder", "organize",
      "organise", "database schema", "which approach", "coupling",
      // French
      "conception", "structurer", "je devrais utiliser", "quel pattern",
      "organiser", "passer à l'échelle", "compromis", "quelle approche",
    ],
  },
  {
    id: "reviewer",
    title: "Code Review Mentor",
    description:
      "Helps you see and improve the weaknesses in your own code: readability, correctness, security.",
    domains: ["review"],
    routeKeywords: [
      // English
      "review", "is this good", "is this correct", "clean", "refactor",
      "improve my code", "feedback", "code smell", "better way", "look at my",
      // French
      "relire", "relis", "revue", "revois", "propre", "améliorer mon code",
      "améliorer", "mon code est", "regarde mon code", "avis sur mon code",
    ],
  },
  {
    id: "ai-coach",
    title: "AI Literacy Coach",
    description:
      "Helps you use AI to learn faster without becoming dependent: decomposing, prompting, verifying.",
    domains: ["ai-literacy"],
    routeKeywords: [
      // English
      "ai", "prompt", "chatgpt", "claude", "copilot", "llm", "generated",
      "should i ask ai", "is this output", "verify", "hallucinat", "trust the ai",
      "depend on ai", "use ai",
      // French
      "ia", "généré par", "vérifier", "dépendant", "dépendance", "utiliser l'ia",
      "faire confiance", "demander à l'ia",
    ],
  },
];

/** The default mentor used when routing finds no better match. */
export const DEFAULT_MENTOR_ID = "tutor";

/**
 * A mutable registry of mentors. Preloaded with the built-ins; register your own
 * to extend Open42 with custom sub-agents.
 */
export class MentorRegistry {
  private readonly mentors = new Map<string, MentorDefinition>();

  constructor(initial: readonly MentorDefinition[] = BUILTIN_MENTORS) {
    for (const mentor of initial) this.register(mentor);
  }

  register(mentor: MentorDefinition): this {
    if (!mentor.id) throw new Error("MentorRegistry: mentor.id is required.");
    if (!mentor.domains?.length && !mentor.prompt?.trim()) {
      throw new Error(
        `MentorRegistry: mentor "${mentor.id}" needs at least one domain or a custom prompt.`,
      );
    }
    this.mentors.set(mentor.id, mentor);
    return this;
  }

  get(id: string): MentorDefinition | undefined {
    return this.mentors.get(id);
  }

  require(id: string): MentorDefinition {
    const mentor = this.get(id);
    if (!mentor) {
      throw new Error(
        `MentorRegistry: no mentor "${id}". Available: ${this.list().map((m) => m.id).join(", ")}.`,
      );
    }
    return mentor;
  }

  /** All registered mentors, in insertion order. */
  list(): readonly MentorDefinition[] {
    return [...this.mentors.values()];
  }
}
