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
  logoutDemoDisabled: string;
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
  keyLabel: string;
  langPickHint: (label: string) => string;
  connectTitle: string;
  connectPasteToken: string;
  connectWeb: string;
  useLocal: string;
  tokenPrompt: string;
  tokenUnknown: string;
  webOpening: string;
  webUrlFallback: (url: string) => string;
  webError: (message: string) => string;
  webRetryHint: string;
  localConnecting: string;
  selectHint: string;
  localReady: string;
  modelDemoDisabled: string;
  modelChanged: (provider: string, model: string) => string;
  modelNeedsKey: (provider: string) => string;
  modelNeedsBaseUrl: string;
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
    "/model           rouvre l'écran de connexion · ou /model <ia> [modèle] pour un changement rapide",
    "/lang <auto|fr|en>  change la langue",
    "/remember        sauvegarde un résumé de la session (mémoire locale)",
    "/memory          affiche ce qui est mémorisé",
    "/forget          efface toute la mémoire",
    "/progress        affiche ton résumé d'autonomie local",
    "/solved          marque une étape résolue par toi-même",
    "/project         affiche le contexte projet actif",
    "/project <nom>   définit le contexte projet actif",
    "/project clear   efface le contexte projet",
    "/logout          se déconnecter (revenir à l'écran de connexion)",
    "/clear           efface la conversation",
    "/quit            quitte",
  ].join("\n"),
  autoRouting: "routage auto",
  logoutDemoDisabled: "La déconnexion est indisponible en mode démo.",
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
  keyLabel: "clé",
  langPickHint: (label) => `Langue : ‹ ${label} ›  (Tab pour changer)`,
  connectTitle: "Aucune IA connectée — connecte-toi :",
  connectPasteToken: "Coller un token API — Claude, OpenAI, OpenRouter, NVIDIA, Groq…",
  connectWeb: "Se connecter via le web — OpenRouter, comme Claude Code",
  useLocal: "Modèle local — gratuit, sur ta machine (Ollama, LM Studio…)",
  tokenPrompt: "Colle ton token API (on détecte le fournisseur automatiquement) :",
  tokenUnknown: "Token non reconnu. Attendu : sk-ant-…, sk-…, sk-or-v1-…, nvapi-…, gsk_…",
  webOpening: "Ouverture du navigateur… autorise Open42 sur OpenRouter, puis reviens ici.",
  webUrlFallback: (url) => `Si rien ne s'ouvre, va sur : ${url}`,
  webError: (message) => `Connexion web échouée : ${message}`,
  webRetryHint: "Entrée pour revenir au menu.",
  localConnecting: "Connexion à ton modèle local…",
  selectHint: "↑/↓ puis Entrée · Tab pour la langue",
  localReady:
    "Mode local : lance d'abord un modèle (ex : ollama run llama3.1), puis pose ta question.",
  modelDemoDisabled: "La commande /model est indisponible en mode démo.",
  modelChanged: (provider, model) => `IA changée : ${provider} · modèle ${model}.`,
  modelNeedsKey: (provider) =>
    `Aucune clé API pour ${provider}. Définis ${provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} dans ton environnement, puis relance /model.`,
  modelNeedsBaseUrl:
    "Le provider custom nécessite une URL d'endpoint. Relance avec --provider custom --base-url <url>, ou configure-le à l'onboarding.",
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
    "/model           reopen the connection screen · or /model <ai> [model] for a quick switch",
    "/lang <auto|fr|en>  change the language",
    "/remember        save a summary of this session (local memory)",
    "/memory          show what is remembered",
    "/forget          erase all memory",
    "/progress        show your local autonomy summary",
    "/solved          mark one step as self-solved",
    "/project         show active project context",
    "/project <name>  set active project context",
    "/project clear   clear project context",
    "/logout          sign out (back to the connection screen)",
    "/clear           clear the conversation",
    "/quit            quit",
  ].join("\n"),
  autoRouting: "auto-routing",
  logoutDemoDisabled: "Sign-out is unavailable in demo mode.",
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
  keyLabel: "key",
  langPickHint: (label) => `Language: ‹ ${label} ›  (Tab to change)`,
  connectTitle: "No AI connected — connect one:",
  connectPasteToken: "Paste an API key — Claude, OpenAI, OpenRouter, NVIDIA, Groq…",
  connectWeb: "Connect via the web — OpenRouter, like Claude Code",
  useLocal: "Local model — free, on your machine (Ollama, LM Studio…)",
  tokenPrompt: "Paste your API key (we detect the provider automatically):",
  tokenUnknown: "Unrecognized token. Expected: sk-ant-…, sk-…, sk-or-v1-…, nvapi-…, gsk_…",
  webOpening: "Opening the browser… authorize Open42 on OpenRouter, then come back here.",
  webUrlFallback: (url) => `If nothing opens, go to: ${url}`,
  webError: (message) => `Web sign-in failed: ${message}`,
  webRetryHint: "Press Enter to go back.",
  localConnecting: "Connecting to your local model…",
  selectHint: "↑/↓ then Enter · Tab for language",
  localReady: "Local mode: start a model first (e.g. ollama run llama3.1), then ask your question.",
  modelDemoDisabled: "The /model command is unavailable in demo mode.",
  modelChanged: (provider, model) => `Switched AI: ${provider} · model ${model}.`,
  modelNeedsKey: (provider) =>
    `No API key for ${provider}. Set ${provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} in your environment, then run /model again.`,
  modelNeedsBaseUrl:
    "The custom provider needs an endpoint URL. Relaunch with --provider custom --base-url <url>, or set it during onboarding.",
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
