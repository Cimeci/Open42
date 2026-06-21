// Public types for the Maïeutique harness.

/** The mentoring domains the harness supports. */
export type Domain =
  | "debugging"
  | "reasoning"
  | "architecture"
  | "review"
  | "ai-literacy";

/**
 * How strictly the mentor withholds the solution.
 * - `strict`    - never reveal solution code (the default, faithful to 42's spirit).
 * - `graduated` - questions first; small code snippets only after sustained effort
 *                 or an explicit request.
 * - `adaptive`  - modulate strictness by the student's demonstrated level.
 */
export type Rigor = "strict" | "graduated" | "adaptive";

/**
 * Prompt verbosity. `full` is the detailed prompt (best for capable models);
 * `compact` is a much shorter prompt that small/local models follow more
 * reliably, while keeping the core guardrails.
 */
export type PromptStyle = "full" | "compact";

/** A turn in the tutoring conversation, from the harness's point of view. */
export interface Message {
  readonly role: "student" | "mentor";
  readonly content: string;
}

/** The mentor's reply. */
export interface MentorReply {
  readonly content: string;
  /** The untouched provider response, for logging/debugging. */
  readonly raw?: unknown;
}

/** Configuration for a Maïeutique mentor instance. */
export interface MaieuticConfig {
  /** The model adapter that actually talks to an LLM. */
  readonly provider: Provider;
  /** Which mentoring domains to enable. Defaults to all four. */
  readonly domains?: readonly Domain[];
  /** How strictly to withhold the solution. Defaults to `strict`. */
  readonly rigor?: Rigor;
  /**
   * Force replies into a specific language (e.g. "français").
   * When omitted, the mentor mirrors the student's language.
   */
  readonly language?: string;
  /** Extra instructions appended verbatim to the system prompt. */
  readonly extraInstructions?: string;
}

// --- Provider abstraction (keeps the harness model-agnostic) -----------------

/** A single message in the provider's wire format. */
export interface ProviderMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** A completion request handed to a provider. */
export interface CompletionRequest {
  readonly system: string;
  readonly messages: readonly ProviderMessage[];
}

/** A completion result returned by a provider. */
export interface CompletionResult {
  readonly content: string;
  readonly raw?: unknown;
}

/** Called with each text delta as a streamed response arrives. */
export type OnTextDelta = (delta: string) => void;

/**
 * The contract every model backend implements. Implement this to plug in any
 * LLM - hosted (Anthropic, OpenAI, …) or local (Ollama, llama.cpp, …).
 *
 * `stream` is optional: providers that implement it enable token-by-token output;
 * the harness falls back to `complete` for providers that don't.
 */
export interface Provider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
  stream?(
    request: CompletionRequest,
    onDelta: OnTextDelta,
    signal?: AbortSignal,
  ): Promise<CompletionResult>;
}

// --- Mentors (sub-agents) ----------------------------------------------------

/**
 * A mentor is a specialised sub-agent: a distinct persona + system prompt the
 * orchestrator can dispatch to. Built-in mentors cover coding domains and AI
 * literacy; you can register your own to extend the architecture.
 */
export interface MentorDefinition {
  /** Stable identifier used to select or route to this mentor. */
  readonly id: string;
  /** Human-facing name, e.g. "Architecture Mentor". */
  readonly title: string;
  /** One line describing what this mentor is for. Used by the router and humans. */
  readonly description: string;
  /** Built-in domain prompts this mentor draws on. */
  readonly domains?: readonly Domain[];
  /**
   * A fully custom role prompt, appended after the shared foundation. Use this to
   * define a mentor the built-in domains don't cover. The foundation (persona,
   * guardrails, independence, method, calibration) is always prepended.
   */
  readonly prompt?: string;
  /** Extra instructions appended verbatim to this mentor's system prompt. */
  readonly extraInstructions?: string;
  /** Hints the heuristic router matches against the student's message. */
  readonly routeKeywords?: readonly string[];
}

/** The reply from the orchestrator, annotated with the mentor that produced it. */
export interface Open42Reply extends MentorReply {
  /** The id of the mentor that handled this turn. */
  readonly mentor: string;
}

/**
 * A router decides which mentor should handle the next turn. Implement this to
 * customise dispatch (heuristic, model-based, rule-based, …).
 */
export interface Router {
  /**
   * Choose the mentor for the next turn. `current` is the mentor that handled the
   * previous turn, if any; routers may use it to stay put when the new message
   * carries no clear signal (sticky routing).
   */
  route(
    transcript: readonly Message[],
    mentors: readonly MentorDefinition[],
    current?: string,
  ): Promise<string> | string;
}
