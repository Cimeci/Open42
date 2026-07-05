// Open42: the orchestrator. Holds a registry of mentors (sub-agents) and a
// router, and dispatches each student turn to the right mentor. This is the
// multi-agent layer on top of the single-mentor Maieutic primitive.

import { composeMentorPrompt } from "./prompts.js";
import { SUMMARIZER, VERIFY } from "./generated/prompts.js";
import { assertRespondable, toProviderMessages } from "./messages.js";
import { MentorRegistry, DEFAULT_MENTOR_ID } from "./mentors.js";
import { HeuristicRouter } from "./router.js";
import type {
  Message,
  MentorDefinition,
  OnTextDelta,
  Open42Reply,
  PromptStyle,
  Provider,
  ProviderMessage,
  Rigor,
  Router,
} from "./types.js";

/** Callbacks for a streamed turn. */
export interface StreamHandlers {
  /** Called once the mentor is selected, before any text. */
  readonly onMentor?: (mentorId: string) => void;
  /** Called with each text delta as it arrives. */
  readonly onText: OnTextDelta;
}

export interface Open42Config {
  /** The model adapter that talks to an LLM. */
  readonly provider: Provider;
  /** Mentors to use. Defaults to the built-in set. */
  readonly mentors?: readonly MentorDefinition[];
  /** How mentors are chosen per turn. Defaults to a keyword HeuristicRouter. */
  readonly router?: Router;
  /** How strictly mentors withhold the solution. Defaults to `strict`. */
  readonly rigor?: Rigor;
  /** Force a reply language; otherwise the mentor mirrors the student. */
  readonly language?: string;
  /** Learner memory injected into every mentor prompt for continuity. */
  readonly memory?: string;
  /**
   * Max number of transcript messages sent to the provider per turn. Older turns
   * are dropped to keep long sessions within the context window. Default 40.
   */
  readonly maxMessages?: number;
  /** Prompt verbosity. Use "compact" for small/local models. Default "full". */
  readonly promptStyle?: PromptStyle;
}

export interface RespondOptions {
  /** Force a specific mentor by id, bypassing the router. */
  readonly mentor?: string;
  /** Abort an in-flight streamed reply. */
  readonly signal?: AbortSignal;
  /** Verification mode for this turn only: reason step by step, give a validation
   * command, cite sources. Layered on top of the routed mentor, not cached. */
  readonly verify?: boolean;
}

export class Open42 {
  private provider: Provider;
  private readonly registry: MentorRegistry;
  private readonly router: Router;
  private readonly rigor: Rigor;
  private language?: string;
  private memory?: string;
  private readonly maxMessages: number;
  private promptStyle: PromptStyle;
  private lastMentorId?: string;
  private readonly promptCache = new Map<string, string>();

  constructor(config: Open42Config) {
    if (!config.provider) throw new Error("Open42: a provider is required.");
    this.provider = config.provider;
    this.registry = new MentorRegistry(config.mentors);
    this.router = config.router ?? new HeuristicRouter(DEFAULT_MENTOR_ID);
    this.rigor = config.rigor ?? "graduated";
    this.language = config.language;
    this.memory = config.memory;
    this.maxMessages = config.maxMessages ?? 40;
    this.promptStyle = config.promptStyle ?? "full";
  }

  /** List the available mentors (sub-agents). */
  listMentors(): readonly MentorDefinition[] {
    return this.registry.list();
  }

  /**
   * Set the forced reply language (e.g. "français"), or undefined to let mentors
   * mirror the student's language. Rebuilds prompts on the next turn.
   */
  setLanguage(language: string | undefined): this {
    this.language = language;
    this.promptCache.clear();
    return this;
  }

  /**
   * Swap the LLM backend at runtime (e.g. the `/model` command). Takes effect on
   * the next turn. The provider does not affect the prompt, so the cache stands.
   */
  setProvider(provider: Provider): this {
    if (!provider) throw new Error("Open42: a provider is required.");
    this.provider = provider;
    return this;
  }

  /**
   * Switch between the detailed and compact system prompts (e.g. when moving to
   * or from a small local model). Rebuilds prompts on the next turn.
   */
  setPromptStyle(promptStyle: PromptStyle): this {
    this.promptStyle = promptStyle;
    this.promptCache.clear();
    return this;
  }

  /** The name of the active provider backend. */
  get providerName(): string {
    return this.provider.name;
  }

  /** Register a custom mentor at runtime. Returns this for chaining. */
  registerMentor(mentor: MentorDefinition): this {
    this.registry.register(mentor);
    this.promptCache.delete(mentor.id);
    return this;
  }

  /** Inspect the composed system prompt for a given mentor. */
  promptFor(mentorId: string): string {
    return this.composePrompt(this.registry.require(mentorId));
  }

  /**
   * Produce the next reply, routing to (or using the chosen) mentor.
   * The transcript must be non-empty and end on a student turn.
   */
  async respond(
    transcript: readonly Message[],
    options: RespondOptions = {},
  ): Promise<Open42Reply> {
    assertRespondable(transcript);

    const mentor = await this.selectMentor(transcript, options);
    const result = await this.provider.complete({
      system: this.composePrompt(mentor, options.verify ? VERIFY : undefined),
      messages: this.providerMessages(transcript),
    });

    return { content: result.content, raw: result.raw, mentor: mentor.id };
  }

  /**
   * Like {@link respond}, but streams the reply via the handlers as it arrives.
   * Falls back to a single chunk for providers that don't support streaming.
   */
  async respondStream(
    transcript: readonly Message[],
    options: RespondOptions,
    handlers: StreamHandlers,
  ): Promise<Open42Reply> {
    assertRespondable(transcript);

    const mentor = await this.selectMentor(transcript, options);
    handlers.onMentor?.(mentor.id);

    const request = {
      system: this.composePrompt(mentor, options.verify ? VERIFY : undefined),
      messages: this.providerMessages(transcript),
    };

    if (this.provider.stream) {
      const result = await this.provider.stream(request, handlers.onText, options.signal);
      return { content: result.content, raw: result.raw, mentor: mentor.id };
    }

    // Fallback: no streaming support - deliver the whole reply at once.
    const result = await this.provider.complete(request);
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    handlers.onText(result.content);
    return { content: result.content, raw: result.raw, mentor: mentor.id };
  }

  /** Replace the injected learner memory. Rebuilds prompts on the next turn. */
  setMemory(memory: string | undefined): this {
    this.memory = memory;
    this.promptCache.clear();
    return this;
  }

  /**
   * Summarize a transcript into a short, conservative note for the student's
   * local memory. Uses the provider; never includes solutions.
   */
  async summarize(transcript: readonly Message[]): Promise<string> {
    const system = this.language ? `${SUMMARIZER}\n\nWrite the summary in ${this.language}.` : SUMMARIZER;
    const result = await this.provider.complete({
      system,
      messages: [
        ...toProviderMessages(transcript),
        { role: "user", content: "Now write the session summary as instructed above." },
      ],
    });
    return result.content.trim();
  }

  /** Resolve the mentor for this turn (explicit pin or sticky routing). */
  private async selectMentor(
    transcript: readonly Message[],
    options: RespondOptions,
  ): Promise<MentorDefinition> {
    const id = options.mentor
      ? this.registry.require(options.mentor).id
      : await this.router.route(transcript, this.registry.list(), this.lastMentorId);
    const mentor = this.registry.require(id);
    this.lastMentorId = mentor.id;
    return mentor;
  }

  /** Map the transcript to provider messages, trimming old turns for long sessions. */
  private providerMessages(transcript: readonly Message[]): ProviderMessage[] {
    let slice = transcript;
    if (slice.length > this.maxMessages) {
      slice = slice.slice(slice.length - this.maxMessages);
      // Drop a leading non-student turn so the message list still starts on the student.
      while (slice.length > 0 && slice[0]!.role !== "student") slice = slice.slice(1);
    }
    return toProviderMessages(slice);
  }

  private composePrompt(mentor: MentorDefinition, extra?: string): string {
    const base = {
      rigor: this.rigor,
      language: this.language,
      memory: this.memory,
      style: this.promptStyle,
    };
    // Per-turn instructions (e.g. /verify) bypass the cache entirely, so the mode
    // never leaks into later turns and a cached prompt is never a verify prompt.
    if (extra) return composeMentorPrompt(mentor, { ...base, extraInstructions: extra });

    const cached = this.promptCache.get(mentor.id);
    if (cached) return cached;
    const prompt = composeMentorPrompt(mentor, base);
    this.promptCache.set(mentor.id, prompt);
    return prompt;
  }
}
