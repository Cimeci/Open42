// Maieutic: the low-level single-mentor primitive — one composed system prompt
// over one provider. Open42 (see open42.ts) layers mentor routing on top.

import { composeSystemPrompt } from "./prompts.js";
import { assertRespondable, toProviderMessages } from "./messages.js";
import type { MaieuticConfig, Message, MentorReply } from "./types.js";

export class Maieutic {
  private readonly config: MaieuticConfig;
  private readonly systemPrompt: string;

  constructor(config: MaieuticConfig) {
    if (!config.provider) throw new Error("Maieutic: a provider is required.");
    this.config = config;
    this.systemPrompt = composeSystemPrompt({
      domains: config.domains,
      rigor: config.rigor,
      language: config.language,
      extraInstructions: config.extraInstructions,
    });
  }

  /** The composed system prompt, exposed for inspection, logging, or reuse. */
  get prompt(): string {
    return this.systemPrompt;
  }

  /**
   * Produce the mentor's next reply given the conversation so far.
   * The transcript must be non-empty and end on a student turn.
   */
  async respond(transcript: readonly Message[]): Promise<MentorReply> {
    assertRespondable(transcript);
    const result = await this.config.provider.complete({
      system: this.systemPrompt,
      messages: toProviderMessages(transcript),
    });
    return { content: result.content, raw: result.raw };
  }
}
