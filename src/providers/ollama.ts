// Local model provider via Ollama's OpenAI-compatible endpoint. Free, no API key.
// Run a model first, e.g.: `ollama run llama3.1`

import { OpenAIProvider } from "./openai.js";
import type { CompletionRequest, CompletionResult, OnTextDelta, Provider } from "../types.js";

export interface OllamaProviderOptions {
  /** Model name as known to Ollama (e.g. "llama3.1", "qwen2.5-coder"). */
  readonly model?: string;
  /** OpenAI-compatible endpoint. Defaults to a local Ollama server. */
  readonly baseUrl?: string;
}

export const DEFAULT_OLLAMA_MODEL = "llama3.1";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1/chat/completions";

export class OllamaProvider implements Provider {
  readonly name = "ollama";
  private readonly inner: OpenAIProvider;

  constructor(options: OllamaProviderOptions = {}) {
    this.inner = new OpenAIProvider({
      // Ollama ignores the key, but the OpenAI-compatible shape expects one.
      apiKey: "ollama",
      model: options.model ?? DEFAULT_OLLAMA_MODEL,
      baseUrl: options.baseUrl ?? DEFAULT_OLLAMA_URL,
    });
  }

  complete(request: CompletionRequest): Promise<CompletionResult> {
    return this.inner.complete(request);
  }

  stream(
    request: CompletionRequest,
    onDelta: OnTextDelta,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    return this.inner.stream(request, onDelta, signal);
  }
}
