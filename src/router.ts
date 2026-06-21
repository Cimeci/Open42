import type { Message, MentorDefinition, Provider, Router } from "./types.js";

function latestStudentMessage(transcript: readonly Message[]): string {
  for (let i = transcript.length - 1; i >= 0; i--) {
    const turn = transcript[i]!;
    if (turn.role === "student") return turn.content;
  }
  return "";
}

/**
 * Default router: scores each mentor by how many of its keywords appear in the
 * latest student message, and picks the best. Falls back to the first mentor.
 * Fast, deterministic, and needs no model call.
 */
export class HeuristicRouter implements Router {
  constructor(private readonly fallbackId?: string) {}

  route(
    transcript: readonly Message[],
    mentors: readonly MentorDefinition[],
    current?: string,
  ): string {
    if (mentors.length === 0) throw new Error("HeuristicRouter: no mentors registered.");

    const text = latestStudentMessage(transcript).toLowerCase();
    let best = mentors[0]!;
    let bestScore = 0;

    for (const mentor of mentors) {
      const score = (mentor.routeKeywords ?? []).reduce(
        (acc, kw) => (text.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        best = mentor;
      }
    }

    // No clear signal: stay with the current mentor (sticky), then the fallback.
    if (bestScore === 0) {
      if (current && mentors.some((m) => m.id === current)) return current;
      if (this.fallbackId && mentors.some((m) => m.id === this.fallbackId)) return this.fallbackId;
    }
    return best.id;
  }
}

/**
 * Model-based router: asks the provider to classify the student's need and pick
 * a mentor by id. More flexible than keywords; costs one model call per turn.
 * Falls back to the first mentor if the model returns an unknown id.
 */
export class LlmRouter implements Router {
  constructor(
    private readonly provider: Provider,
    private readonly fallbackId?: string,
  ) {}

  async route(
    transcript: readonly Message[],
    mentors: readonly MentorDefinition[],
    current?: string,
  ): Promise<string> {
    if (mentors.length === 0) throw new Error("LlmRouter: no mentors registered.");

    const catalogue = mentors.map((m) => `- ${m.id}: ${m.description}`).join("\n");
    const system =
      "You are a router for a tutoring system. Given the student's latest message, " +
      "reply with ONLY the id of the single most appropriate mentor - no other text.\n\n" +
      `Available mentors:\n${catalogue}`;

    const result = await this.provider.complete({
      system,
      messages: [{ role: "user", content: latestStudentMessage(transcript) }],
    });

    const picked = result.content.trim().toLowerCase();
    const match =
      mentors.find((m) => picked === m.id.toLowerCase()) ??
      mentors.find((m) => picked.includes(m.id.toLowerCase()));
    return match?.id ?? current ?? this.fallbackId ?? mentors[0]!.id;
  }
}
