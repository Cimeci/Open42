// Open42 - a portable, provider-agnostic Socratic mentoring harness that helps
// students learn to code, reason, architect, review, and use AI well - without
// becoming dependent on it.

export { Open42 } from "./open42.js";
export type { Open42Config, RespondOptions, StreamHandlers } from "./open42.js";

export { Maieutic } from "./harness.js";

export { MentorRegistry, BUILTIN_MENTORS, DEFAULT_MENTOR_ID } from "./mentors.js";

export { HeuristicRouter, LlmRouter } from "./router.js";

export { composeSystemPrompt, composeMentorPrompt, ALL_DOMAINS } from "./prompts.js";

export {
  runStructuralEvals,
  runBehaviouralEvals,
  behaviouralChecks,
  ROUTING_SCENARIOS,
  BEHAVIOURAL_SCENARIOS,
} from "./evals.js";
export type { EvalReport, CheckResult, RoutingScenario, BehaviouralScenario } from "./evals.js";

export { AnthropicProvider } from "./providers/anthropic.js";
export type { AnthropicProviderOptions } from "./providers/anthropic.js";
export { OpenAIProvider } from "./providers/openai.js";
export type { OpenAIProviderOptions } from "./providers/openai.js";
export { OllamaProvider, DEFAULT_OLLAMA_MODEL } from "./providers/ollama.js";
export type { OllamaProviderOptions } from "./providers/ollama.js";

export type {
  Domain,
  Rigor,
  PromptStyle,
  Message,
  MentorReply,
  MaieuticConfig,
  MentorDefinition,
  Open42Reply,
  Router,
  Provider,
  ProviderMessage,
  OnTextDelta,
  CompletionRequest,
  CompletionResult,
} from "./types.js";
