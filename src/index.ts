// Open42 — a portable, provider-agnostic Socratic mentoring harness that helps
// students learn to code, reason, architect, review, and use AI well — without
// becoming dependent on it.

// Orchestrator (multi-mentor / sub-agent layer)
export { Open42 } from "./open42.js";
export type { Open42Config, RespondOptions } from "./open42.js";

// Single-mentor primitive
export { Maieutic } from "./harness.js";

// Mentors (sub-agents) and the extensible registry
export { MentorRegistry, BUILTIN_MENTORS, DEFAULT_MENTOR_ID } from "./mentors.js";

// Routers
export { HeuristicRouter, LlmRouter } from "./router.js";

// Prompt composition
export { composeSystemPrompt, composeMentorPrompt, ALL_DOMAINS } from "./prompts.js";

// Evals (pedagogical evaluation harness)
export {
  runStructuralEvals,
  runBehaviouralEvals,
  behaviouralChecks,
  ROUTING_SCENARIOS,
  BEHAVIOURAL_SCENARIOS,
} from "./evals.js";
export type { EvalReport, CheckResult, RoutingScenario, BehaviouralScenario } from "./evals.js";

// Providers
export { AnthropicProvider } from "./providers/anthropic.js";
export type { AnthropicProviderOptions } from "./providers/anthropic.js";
export { OpenAIProvider } from "./providers/openai.js";
export type { OpenAIProviderOptions } from "./providers/openai.js";
export { OllamaProvider, DEFAULT_OLLAMA_MODEL } from "./providers/ollama.js";
export type { OllamaProviderOptions } from "./providers/ollama.js";

// Types
export type {
  Domain,
  Rigor,
  Message,
  MentorReply,
  MaieuticConfig,
  MentorDefinition,
  Open42Reply,
  Router,
  Provider,
  ProviderMessage,
  CompletionRequest,
  CompletionResult,
} from "./types.js";
