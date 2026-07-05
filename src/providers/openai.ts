// OpenAI-compatible provider - works with OpenAI and any compatible endpoint
// (Ollama, LM Studio, vLLM, OpenRouter, …) by overriding `baseUrl`.

import type { CompletionRequest, CompletionResult, OnTextDelta, Provider } from "../types.js";
import { readSSE } from "./sse.js";
import { networkErrorDetail, safeErrorDetail, REQUEST_TIMEOUT_MS } from "./util.js";

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
    const response = await this.send({
      model: this.opts.model,
      max_tokens: this.opts.maxTokens,
      messages: this.messagesFor(request),
    });

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
    const response = await this.send(
      {
        model: this.opts.model,
        max_tokens: this.opts.maxTokens,
        stream: true,
        messages: this.messagesFor(request),
      },
      signal,
    );

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

  private messagesFor(request: CompletionRequest): Array<{ role: string; content: string }> {
    return [
      { role: "system", content: request.system },
      ...request.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
  }

  /** POST the payload, turning connection failures and non-OK responses into clear errors. */
  private async send(payload: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    // Streamed calls carry the caller's abort signal (Ctrl+C); non-streamed calls
    // (e.g. /remember) get a default timeout so a dead endpoint can't hang forever.
    const effectiveSignal = signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(this.opts.baseUrl, {
        method: "POST",
        signal: effectiveSignal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.opts.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (signal?.aborted) throw err;
      throw new Error(
        `OpenAIProvider: could not reach ${this.opts.baseUrl} — is the server running? (${networkErrorDetail(err)})`,
      );
    }

    if (!response.ok) {
      const detail = await safeErrorDetail(response);
      throw new Error(`OpenAIProvider: HTTP ${response.status} - ${detail}`);
    }
    return response;
  }
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}
