// OpenAI-compatible provider - works with OpenAI and any compatible endpoint
// (Ollama, LM Studio, vLLM, OpenRouter, …) by overriding `baseUrl`.

import type { CompletionRequest, CompletionResult, OnTextDelta, Provider } from "../types.js";
import { readSSE } from "./sse.js";

export interface OpenAIProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly maxTokens?: number;
  /** Override to point at any OpenAI-compatible server. */
  readonly baseUrl?: string;
}

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_BASE_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements Provider {
  readonly name = "openai";
  private readonly opts: Required<OpenAIProviderOptions>;

  constructor(options: OpenAIProviderOptions) {
    if (!options.apiKey) throw new Error("OpenAIProvider: apiKey is required.");
    this.opts = {
      apiKey: options.apiKey,
      model: options.model ?? DEFAULT_MODEL,
      maxTokens: options.maxTokens ?? 1024,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    };
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch(this.opts.baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model,
        max_tokens: this.opts.maxTokens,
        messages: [
          { role: "system", content: request.system },
          ...request.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const detail = await safeText(response);
      throw new Error(`OpenAIProvider: HTTP ${response.status} - ${detail}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("OpenAIProvider: empty response from model.");
    return { content, raw: data };
  }

  async stream(
    request: CompletionRequest,
    onDelta: OnTextDelta,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    const response = await fetch(this.opts.baseUrl, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model,
        max_tokens: this.opts.maxTokens,
        stream: true,
        messages: [
          { role: "system", content: request.system },
          ...request.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const detail = await safeText(response);
      throw new Error(`OpenAIProvider: HTTP ${response.status} - ${detail}`);
    }

    let content = "";
    await readSSE(response, (data) => {
      if (data === "[DONE]") return;
      try {
        const event = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const text = event.choices?.[0]?.delta?.content ?? "";
        if (text) {
          content += text;
          onDelta(text);
        }
      } catch {
        // Ignore non-JSON lines.
      }
    });

    if (!content) throw new Error("OpenAIProvider: empty streamed response.");
    return { content };
  }
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}
