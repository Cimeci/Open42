// Composes system prompts from the modular Markdown prompt sources.

import {
  PERSONA,
  GUARDRAILS,
  INDEPENDENCE,
  METHOD,
  CALIBRATION,
  DOMAINS,
} from "./generated/prompts.js";
import type { Domain, MentorDefinition, Rigor } from "./types.js";

/** Canonical ordering for all domains (used for stable dedupe/ordering). */
const DOMAIN_ORDER: readonly Domain[] = [
  "debugging",
  "reasoning",
  "architecture",
  "review",
  "ai-literacy",
];

/** The coding domains enabled by default for the base mentor. */
export const ALL_DOMAINS: readonly Domain[] = [
  "debugging",
  "reasoning",
  "architecture",
  "review",
];

const SECTION_RULE = "\n\n---\n\n";

/**
 * The shared foundation present in EVERY mentor: who the mentor is, the rules,
 * the independence creed, the Socratic method, and calibration. This is what
 * keeps every sub-agent faithful to the Open42 philosophy.
 */
const FOUNDATION = [PERSONA, GUARDRAILS, INDEPENDENCE, METHOD, CALIBRATION];

// Rigor modifiers. `graduated` is the default and matches the baseline guardrails,
// so it adds nothing. `strict` and `adaptive` adjust how much may be revealed.
const RIGOR_MODIFIERS: Record<Rigor, string> = {
  graduated: "",
  strict:
    "# Rigor: strict\n\n" +
    "Hold back further than the baseline: do not reveal solution code at all. " +
    "Guide only with questions, hints, analogies, and pointers to concepts. Even " +
    "when a student is stuck, shrink the question rather than revealing the answer.",
  adaptive:
    "# Rigor: adaptive\n\n" +
    "Modulate by the student's demonstrated level. Stay question-only for " +
    "fundamentals they are meant to master. For a genuinely new concept blocking " +
    "all progress, a more explicit explanation is fine, but never a finished " +
    "solution to their actual task.",
};

export interface ComposeOptions {
  readonly domains?: readonly Domain[];
  readonly rigor?: Rigor;
  readonly language?: string;
  readonly extraInstructions?: string;
}

/**
 * Build a system prompt for the base, general-purpose mentor.
 * Order: foundation → rigor → active domains → language → extras.
 */
export function composeSystemPrompt(options: ComposeOptions = {}): string {
  const domains = orderDomains(options.domains ?? ALL_DOMAINS);
  return assemble({
    domains,
    rigor: options.rigor ?? "graduated",
    language: options.language,
    extraInstructions: options.extraInstructions,
  });
}

export interface ComposeMentorOptions {
  readonly rigor?: Rigor;
  readonly language?: string;
}

/**
 * Build the system prompt for a specific mentor (sub-agent). The shared
 * foundation is always prepended, then the mentor's role/domains, so every
 * mentor stays faithful to the guardrails and independence philosophy.
 */
export function composeMentorPrompt(
  mentor: MentorDefinition,
  options: ComposeMentorOptions = {},
): string {
  const roleHeader = `# Mentor role: ${mentor.title}\n\n${mentor.description}`;
  return assemble({
    domains: orderDomains(mentor.domains ?? []),
    rigor: options.rigor ?? "graduated",
    language: options.language,
    roleHeader,
    customPrompt: mentor.prompt,
    extraInstructions: mentor.extraInstructions,
  });
}

interface AssembleArgs {
  readonly domains: readonly Domain[];
  readonly rigor: Rigor;
  readonly language?: string;
  readonly roleHeader?: string;
  readonly customPrompt?: string;
  readonly extraInstructions?: string;
}

function assemble(args: AssembleArgs): string {
  const parts: string[] = [...FOUNDATION];

  const rigorModifier = RIGOR_MODIFIERS[args.rigor];
  if (rigorModifier) parts.push(rigorModifier);

  if (args.roleHeader) parts.push(args.roleHeader);

  if (args.domains.length > 0) {
    parts.push(`# Active mentoring domains\n\n${args.domains.map((d) => `- ${d}`).join("\n")}`);
    for (const domain of args.domains) parts.push(DOMAINS[domain]);
  }

  if (args.customPrompt?.trim()) parts.push(args.customPrompt.trim());

  if (args.language) parts.push(`# Language\n\nAlways respond in ${args.language}.`);

  if (args.extraInstructions?.trim()) parts.push(args.extraInstructions.trim());

  return parts.join(SECTION_RULE);
}

function orderDomains(domains: readonly Domain[]): readonly Domain[] {
  // Preserve canonical order, drop duplicates and unknown entries.
  return DOMAIN_ORDER.filter((d) => domains.includes(d));
}
