// Slash-command catalogue for the in-chat command palette. Kept separate and
// pure so filtering can be unit-tested without Ink.

import type { UiLang } from "./i18n.js";

export interface SlashCommand {
  readonly name: string;
  /** Expected arguments shown after the name, e.g. "<id>" or "[name|clear]". */
  readonly hint: string;
  readonly summary: string;
  /** True when the command needs an argument, so Enter completes instead of runs. */
  readonly requiresArg: boolean;
}

interface CommandDef {
  name: string;
  hint?: string;
  arg?: "required" | "optional";
  fr: string;
  en: string;
}

const DEFS: readonly CommandDef[] = [
  { name: "help", fr: "affiche l'aide", en: "show help" },
  { name: "mentors", fr: "liste les mentors", en: "list the mentors" },
  { name: "mentor", hint: "<id>", arg: "required", fr: "fixe un mentor", en: "pin a mentor" },
  { name: "auto", fr: "routage automatique", en: "resume automatic routing" },
  { name: "model", hint: "[ia] [modèle]", arg: "optional", fr: "change d'IA (écran de connexion)", en: "switch AI (connection screen)" },
  { name: "verify", hint: "[question]", arg: "optional", fr: "vérifie la réponse de l'IA (raisonnement + validation + sources)", en: "verify the AI's answer (reasoning + validation + sources)" },
  { name: "lang", hint: "<auto|fr|en>", arg: "required", fr: "change la langue", en: "change the language" },
  { name: "remember", fr: "sauvegarde la session", en: "save this session" },
  { name: "memory", fr: "affiche la mémoire", en: "show memory" },
  { name: "forget", fr: "efface la mémoire", en: "erase memory" },
  { name: "progress", fr: "résumé d'autonomie", en: "autonomy summary" },
  { name: "solved", fr: "marque une étape auto-résolue", en: "mark a self-solved step" },
  { name: "project", hint: "[nom|clear]", arg: "optional", fr: "contexte projet", en: "project context" },
  { name: "logout", fr: "se déconnecter", en: "sign out" },
  { name: "clear", fr: "efface la conversation", en: "clear the conversation" },
  { name: "quit", fr: "quitte", en: "quit" },
];

export function slashCommands(lang: UiLang): SlashCommand[] {
  return DEFS.map((def) => ({
    name: def.name,
    hint: def.hint ?? "",
    summary: lang === "fr" ? def.fr : def.en,
    requiresArg: def.arg === "required",
  }));
}

/**
 * Filter commands by a query (the text after `/`), matching the command name by
 * prefix. An exact match is floated to the top so typing a full command name
 * (e.g. `mentor`) selects it, not a longer command sharing its prefix
 * (`mentors`). An empty query returns everything.
 */
export function filterCommands(commands: SlashCommand[], query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  const matches = commands.filter((c) => c.name.startsWith(q));
  return [...matches.filter((c) => c.name === q), ...matches.filter((c) => c.name !== q)];
}
