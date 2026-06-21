// Anthropic (Claude) provider — uses the HTTP API directly, no SDK dependency.

import type { CompletionRequest, CompletionResult, OnTextDelta, Provider } from "../types.js";
import { readSSE } from "./sse.js";

export interface AnthropicProviderOptions {
  readonly apiKey: string;
  /** Defaults to a current Claude model. */
  readonly model?: string;
  readonly maxTokens?: number;
  /** Override for proxies / gateways. */
  readonly baseUrl?: string;
  readonly anthropicVersion?: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_BASE_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_VERSION = "2023-06-01";

export class AnthropicProvider implements Provider {
  readonly name = "anthropic";
  private readonly opts: Required<AnthropicProviderOptions>;

  constructor(options: AnthropicProviderOptions) {
    if (!options.apiKey) throw new Error("AnthropicProvider: apiKey is required.");
    this.opts = {
      apiKey: options.apiKey,
      model: options.model ?? DEFAULT_MODEL,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      anthropicVersion: options.anthropicVersion ?? DEFAULT_VERSION,
    };
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch(this.opts.baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.opts.apiKey,
        "anthropic-version": this.opts.anthropicVersion,
      },
      body: JSON.stringify({
        model: this.opts.model,
        max_tokens: this.opts.maxTokens,
        system: request.system,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const detail = await safeText(response);
      throw new Error(`AnthropicProvider: HTTP ${response.status} — ${detail}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const content = (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!content) throw new Error("AnthropicProvider: empty response from model.");
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
        "x-api-key": this.opts.apiKey,
        "anthropic-version": this.opts.anthropicVersion,
      },
      body: JSON.stringify({
        model: this.opts.model,
        max_tokens: this.opts.maxTokens,
        stream: true,
        system: request.system,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const detail = await safeText(response);
      throw new Error(`AnthropicProvider: HTTP ${response.status} — ${detail}`);
    }

    let content = "";
    await readSSE(response, (data) => {
      if (data === "[DONE]") return;
      try {
        const event = JSON.parse(data) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          const text = event.delta.text ?? "";
          if (text) {
            content += text;
            onDelta(text);
          }
        }
      } catch {
        // Ignore keep-alive pings and non-JSON lines.
      }
    });

    if (!content) throw new Error("AnthropicProvider: empty streamed response.");
    return { content };
  }
}

interface AnthropicResponse {
  content?: Array<{ type: string; text: string }>;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}
