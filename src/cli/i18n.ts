// Localisation for the terminal UI chrome (the conversation itself is handled by
// the mentor, which mirrors or is forced to the chosen language separately).

export type UiLang = "fr" | "en";

/** What the user can pick: an explicit language, or "auto" (mirror the student). */
export type LangChoice = "auto" | UiLang;

export interface Strings {
  youLabel: string;
  taglineLead: string;
  taglineEmphasis: string;
  welcome: string;
  inputPlaceholder: string;
  thinking: string;
  interrupted: string;
  quitHint: string;
  help: string;
  autoRouting: string;
  helpHint: string;
  contextNew: string;
  context: (exchanges: number, pinned?: string) => string;
  exchanges: (n: number) => string;
  mentorMode: (id: string) => string;
  mentorsHeader: string;
  mentorSet: (title: string) => string;
  mentorUnknown: (arg: string) => string;
  autoOn: string;
  unknownCmd: (cmd: string) => string;
  langSet: (label: string) => string;
  langUsage: string;
  langAutoLabel: string;
  onboardingTitle: string;
  onboardingHint: string;
  keyLabel: string;
  langPickHint: (label: string) => string;
  emptyKeyError: string;
  providerQuestion: string;
  providerAnthropic: string;
  providerOpenAI: string;
  providerLocal: string;
  selectHint: string;
  localReady: string;
  memorySaving: string;
  memorySaved: (path: string) => string;
  memoryNothing: string;
  memoryEmpty: string;
  memoryHeader: (n: number) => string;
  memoryForgotten: (n: number) => string;
  memoryDemoDisabled: string;
  rememberNudge: string;
  solvedMarked: string;
  progressSummary: (args: {
    sessions: number;
    mentorRequests: number;
    savedMemories: number;
    selfSolved: number;
    level: string;
  }) => string;
  progressLevelStarter: string;
  progressLevelGrowing: string;
  progressLevelAutonomous: string;
  projectUsage: string;
  projectCurrent: (name: string) => string;
  projectEmpty: string;
  projectSet: (name: string) => string;
  projectCleared: string;
}

const FR: Strings = {
  youLabel: "toi",
  taglineLead: "Apprends en comprenant, avec l'IA comme",
  taglineEmphasis: "guide, pas comme béquille.",
  welcome:
    "Pose ta question. Je t'accompagne pour comprendre et réfléchir, pas pour te livrer une réponse à recopier. Tape /help pour les commandes.",
  inputPlaceholder: "Pose ta question…",
  thinking: "réflexion… (Ctrl+C pour annuler)",
  interrupted: "Prompt interrompu.",
  quitHint: "Ctrl+C encore pour quitter",
  help: [
    "/help            affiche cette aide",
    "/mentors         liste les mentors disponibles",
    "/mentor <id>     fixe un mentor (ex: /mentor ai-coach)",
    "/auto            reprend le routage automatique",
    "/lang <auto|fr|en>  change la langue",
    "/remember        sauvegarde un résumé de la session (mémoire locale)",
    "/memory          affiche ce qui est mémorisé",
    "/forget          efface toute la mémoire",
    "/progress        affiche ton résumé d'autonomie local",
    "/solved          marque une étape résolue par toi-même",
    "/project         affiche le contexte projet actif",
    "/project <nom>   définit le contexte projet actif",
    "/project clear   efface le contexte projet",
    "/clear           efface la conversation",
    "/quit            quitte",
  ].join("\n"),
  autoRouting: "routage auto",
  helpHint: "/help",
  contextNew: "Contexte : nouvelle conversation.",
  context: (n, pinned) =>
    `Contexte : ${n} échange${n === 1 ? "" : "s"}${pinned ? ` · mentor ${pinned}` : ""}.`,
  exchanges: (n) => `${n} échange${n === 1 ? "" : "s"}`,
  mentorMode: (id) => `mentor ${id}`,
  mentorsHeader: "Mentors disponibles :",
  mentorSet: (title) => `Mentor fixé : ${title}. /auto pour revenir au routage.`,
  mentorUnknown: (arg) => `Mentor inconnu "${arg}". Voir /mentors.`,
  autoOn: "Routage automatique réactivé.",
  unknownCmd: (cmd) => `Commande inconnue "/${cmd}". Voir /help.`,
  langSet: (label) => `Langue : ${label}.`,
  langUsage: "Usage : /lang auto | fr | en",
  langAutoLabel: "automatique (langue de l'étudiant)",
  onboardingTitle: "Bienvenue ! Colle une clé API pour commencer.",
  onboardingHint: "Anthropic (sk-ant-…) ou OpenAI (sk-…). Sauvegardée dans ~/.open42/config.json.",
  keyLabel: "clé",
  langPickHint: (label) => `Langue : ‹ ${label} ›  (Tab pour changer)`,
  emptyKeyError: "Merci de coller une clé non vide.",
  providerQuestion: "Que veux-tu utiliser ?",
  providerAnthropic: "Anthropic (Claude) : avec une clé API",
  providerOpenAI: "OpenAI (GPT) : avec une clé API",
  providerLocal: "Local (Ollama) : gratuit, sans clé",
  selectHint: "↑/↓ puis Entrée · Tab pour la langue",
  localReady:
    "Mode local : lance d'abord un modèle (ex : ollama run llama3.1), puis pose ta question.",
  memorySaving: "Résumé de la session en cours…",
  memorySaved: (path) => `Mémoire enregistrée : ${path}`,
  memoryNothing: "Rien à mémoriser pour l'instant (la conversation est vide).",
  memoryEmpty: "Aucun souvenir enregistré pour l'instant.",
  memoryHeader: (n) => `Mémoire : ${n} session${n === 1 ? "" : "s"} enregistrée${n === 1 ? "" : "s"}.`,
  memoryForgotten: (n) => `Mémoire effacée (${n} session${n === 1 ? "" : "s"} supprimée${n === 1 ? "" : "s"}).`,
  memoryDemoDisabled: "La mémoire est désactivée en mode démo.",
  rememberNudge:
    "Tu sembles bien avancer. Pense à /remember pour garder une trace locale de ce que tu as compris.",
  solvedMarked: "Étape marquée comme résolue par toi-même.",
  progressSummary: ({ sessions, mentorRequests, savedMemories, selfSolved, level }) =>
    [
      "Progression locale :",
      `- niveau d'autonomie : ${level}`,
      `- sessions : ${sessions}`,
      `- demandes mentor : ${mentorRequests}`,
      `- souvenirs enregistrés : ${savedMemories}`,
      `- étapes auto-résolues : ${selfSolved}`,
    ].join("\n"),
  progressLevelStarter: "démarrage",
  progressLevelGrowing: "en progression",
  progressLevelAutonomous: "autonome",
  projectUsage: "Usage : /project | /project <nom> | /project clear",
  projectCurrent: (name) => `Contexte projet actif : ${name}`,
  projectEmpty: "Aucun contexte projet actif.",
  projectSet: (name) => `Contexte projet défini : ${name}`,
  projectCleared: "Contexte projet effacé.",
};

const EN: Strings = {
  youLabel: "you",
  taglineLead: "Learn by understanding, with AI as your",
  taglineEmphasis: "guide, not your crutch.",
  welcome:
    "Ask your question. I help you understand and think, not hand you an answer to copy. Type /help for commands.",
  inputPlaceholder: "Ask your question…",
  thinking: "thinking… (Ctrl+C to cancel)",
  interrupted: "Prompt cancelled.",
  quitHint: "Press Ctrl+C again to quit",
  help: [
    "/help            show this help",
    "/mentors         list available mentors",
    "/mentor <id>     pin a mentor (e.g. /mentor ai-coach)",
    "/auto            resume automatic routing",
    "/lang <auto|fr|en>  change the language",
    "/remember        save a summary of this session (local memory)",
    "/memory          show what is remembered",
    "/forget          erase all memory",
    "/progress        show your local autonomy summary",
    "/solved          mark one step as self-solved",
    "/project         show active project context",
    "/project <name>  set active project context",
    "/project clear   clear project context",
    "/clear           clear the conversation",
    "/quit            quit",
  ].join("\n"),
  autoRouting: "auto-routing",
  helpHint: "/help",
  contextNew: "Context: new conversation.",
  context: (n, pinned) =>
    `Context: ${n} exchange${n === 1 ? "" : "s"}${pinned ? ` · mentor ${pinned}` : ""}.`,
  exchanges: (n) => `${n} exchange${n === 1 ? "" : "s"}`,
  mentorMode: (id) => `mentor ${id}`,
  mentorsHeader: "Available mentors:",
  mentorSet: (title) => `Pinned to ${title}. /auto to resume routing.`,
  mentorUnknown: (arg) => `Unknown mentor "${arg}". See /mentors.`,
  autoOn: "Automatic routing resumed.",
  unknownCmd: (cmd) => `Unknown command "/${cmd}". See /help.`,
  langSet: (label) => `Language: ${label}.`,
  langUsage: "Usage: /lang auto | fr | en",
  langAutoLabel: "automatic (student's language)",
  onboardingTitle: "Welcome! Paste an API key to get started.",
  onboardingHint: "Anthropic (sk-ant-…) or OpenAI (sk-…). Saved to ~/.open42/config.json.",
  keyLabel: "key",
  langPickHint: (label) => `Language: ‹ ${label} ›  (Tab to change)`,
  emptyKeyError: "Please paste a non-empty API key.",
  providerQuestion: "What do you want to use?",
  providerAnthropic: "Anthropic (Claude): with an API key",
  providerOpenAI: "OpenAI (GPT): with an API key",
  providerLocal: "Local (Ollama): free, no key",
  selectHint: "↑/↓ then Enter · Tab for language",
  localReady: "Local mode: start a model first (e.g. ollama run llama3.1), then ask your question.",
  memorySaving: "Summarizing the session…",
  memorySaved: (path) => `Memory saved: ${path}`,
  memoryNothing: "Nothing to remember yet (the conversation is empty).",
  memoryEmpty: "No memory saved yet.",
  memoryHeader: (n) => `Memory: ${n} session${n === 1 ? "" : "s"} saved.`,
  memoryForgotten: (n) => `Memory erased (${n} session${n === 1 ? "" : "s"} removed).`,
  memoryDemoDisabled: "Memory is disabled in demo mode.",
  rememberNudge:
    "You are making progress. Consider /remember to save a short local note of what you learned.",
  solvedMarked: "Marked one self-solved step.",
  progressSummary: ({ sessions, mentorRequests, savedMemories, selfSolved, level }) =>
    [
      "Local progress:",
      `- autonomy level: ${level}`,
      `- sessions: ${sessions}`,
      `- mentor requests: ${mentorRequests}`,
      `- saved memories: ${savedMemories}`,
      `- self-solved steps: ${selfSolved}`,
    ].join("\n"),
  progressLevelStarter: "starter",
  progressLevelGrowing: "growing",
  progressLevelAutonomous: "autonomous",
  projectUsage: "Usage: /project | /project <name> | /project clear",
  projectCurrent: (name) => `Active project context: ${name}`,
  projectEmpty: "No active project context.",
  projectSet: (name) => `Project context set: ${name}`,
  projectCleared: "Project context cleared.",
};

export function strings(lang: UiLang): Strings {
  return lang === "fr" ? FR : EN;
}

/** Guess a UI language from the OS locale, defaulting to English. */
export function detectSystemLang(): UiLang {
  const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || "";
  return locale.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** The forced reply-language name for a choice, or undefined to mirror. */
export function replyLanguageOf(choice: LangChoice): string | undefined {
  if (choice === "fr") return "français";
  if (choice === "en") return "English";
  return undefined;
}

/** The UI language for a choice (auto resolves to the system locale). */
export function uiLangOf(choice: LangChoice): UiLang {
  return choice === "auto" ? detectSystemLang() : choice;
}
