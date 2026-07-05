// Local model provider via Ollama's OpenAI-compatible endpoint. Free, no API key.
// Run a model first, e.g.: `ollama run llama3.1`

import { OpenAIProvider } from "./openai.js";
import { listModelsAt } from "./localModels.js";
import type { CompletionRequest, CompletionResult, OnTextDelta, Provider } from "../types.js";

export interface OllamaProviderOptions {
  /** Model name as known to Ollama (e.g. "llama3.1", "qwen2.5-coder"). */
  readonly model?: string;
  /** OpenAI-compatible chat-completions endpoint. Defaults to a local Ollama server. */
  readonly baseUrl?: string;
}

export const DEFAULT_OLLAMA_MODEL = "llama3.1";
export const DEFAULT_OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_OLLAMA_URL = `${DEFAULT_OLLAMA_HOST}/v1/chat/completions`;

/** List the models available in a local Ollama server. Empty array if unreachable. */
export async function listOllamaModels(host: string = DEFAULT_OLLAMA_HOST): Promise<string[]> {
  try {
    return await listModelsAt(`${host.replace(/\/+$/, "")}/v1`);
  } catch {
    return [];
  }
}

export class OllamaProvider implements Provider {
  readonly name = "ollama";
  private readonly inner: OpenAIProvider;
  private readonly model: string;
  private readonly url: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.model = options.model ?? DEFAULT_OLLAMA_MODEL;
    this.url = options.baseUrl ?? DEFAULT_OLLAMA_URL;
    this.inner = new OpenAIProvider({
      // Ollama ignores the key, but the OpenAI-compatible shape expects one.
      apiKey: "ollama",
      model: this.model,
      baseUrl: this.url,
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    try {
      return await this.inner.complete(request);
    } catch (err) {
      throw this.explain(err);
    }
  }

  async stream(
    request: CompletionRequest,
    onDelta: OnTextDelta,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    try {
      return await this.inner.stream(request, onDelta, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      throw this.explain(err);
    }
  }

  /** Turn a raw provider error into an actionable, Ollama-specific hint. */
  private explain(err: unknown): Error {
    const message = err instanceof Error ? err.message : String(err);
    if (/could not reach|ECONNREFUSED|fetch failed/i.test(message)) {
      return new Error(
        `Ollama is not reachable at ${this.url}. Start it with \`ollama serve\`, ` +
          `then pull a model with \`ollama pull ${this.model}\`.`,
      );
    }
    if (/HTTP 404/.test(message)) {
      return new Error(
        `Model "${this.model}" is not installed in Ollama. ` +
          `Run \`ollama pull ${this.model}\`, or pick another one with /model.`,
      );
    }
    return err instanceof Error ? err : new Error(message);
  }
}
