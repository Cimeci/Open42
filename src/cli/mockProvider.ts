// A keyless mock provider for the demo mode. It returns canned, in-character
// Socratic replies (streamed) so you can experience the full UI without an API
// key. It never contacts a model.

import type {
  CompletionRequest,
  CompletionResult,
  OnTextDelta,
  Provider,
} from "../types.js";

type ReplyKey = "tutor" | "architect" | "reviewer" | "ai-coach" | "default";

const REPLIES_FR: Record<ReplyKey, string> = {
  tutor:
    "Bonne question, ce genre de blocage arrive à tout le monde. Avant de toucher au code : " +
    "pour un cas simple, quel résultat attends-tu exactement, et qu'obtiens-tu à la place ? " +
    "Décris-moi l'écart entre les deux.",
  architect:
    "Intéressant. Pour quoi optimises-tu ici : la simplicité, la performance, l'évolutivité ? " +
    "Tu ne peux pas tout maximiser. Et quelle autre approche pourrais-tu mettre en face de " +
    "celle-ci pour les comparer ?",
  reviewer:
    "Relisons ensemble. Quel nom dans ce code risque de perdre un lecteur dans six mois ? " +
    "Et quel cas limite (vide, nul, énorme) n'as-tu pas encore traité ?",
  "ai-coach":
    "Avant même de demander à l'IA : peux-tu formuler en une seule phrase ce qui te bloque " +
    "vraiment ? Et une fois sa réponse obtenue, comment vérifieras-tu, par toi-même, qu'elle " +
    "est correcte ?",
  default: "Que penses-tu qu'il se passe ici, étape par étape ? Commençons par la première.",
};

const REPLIES_EN: Record<ReplyKey, string> = {
  tutor:
    "Good question, this kind of snag happens to everyone. Before touching the code: for one " +
    "simple case, what result do you expect exactly, and what do you get instead? Describe the " +
    "gap between the two.",
  architect:
    "Interesting. What are you optimising for here: simplicity, performance, scalability? You " +
    "can't max them all. And what other approach could you put next to this one to compare?",
  reviewer:
    "Let's read it together. Which name in this code might lose a reader in six months? And which " +
    "edge case (empty, null, huge) have you not handled yet?",
  "ai-coach":
    "Before even asking the AI: can you state in one sentence what is actually blocking you? And " +
    "once you have its answer, how will you check, on your own, that it is correct?",
  default: "What do you think happens here, step by step? Let's start with the first one.",
};

function pickReply(system: string): string {
  const replies = system.includes("Always respond in English.") ? REPLIES_EN : REPLIES_FR;
  if (system.includes("Socratic Tutor")) return replies.tutor;
  if (system.includes("Architecture Mentor")) return replies.architect;
  if (system.includes("Code Review Mentor")) return replies.reviewer;
  if (system.includes("AI Literacy Coach")) return replies["ai-coach"];
  return replies.default;
}

function chunk(text: string): string[] {
  return text.match(/.{1,4}/gs) ?? [text];
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MockProvider implements Provider {
  readonly name = "mock";

  constructor(private readonly chunkDelayMs = 12) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    return { content: pickReply(request.system) };
  }

  async stream(
    request: CompletionRequest,
    onDelta: OnTextDelta,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    const reply = pickReply(request.system);
    let sent = "";
    for (const piece of chunk(reply)) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      onDelta(piece);
      sent += piece;
      await delay(this.chunkDelayMs);
    }
    return { content: sent };
  }
}
