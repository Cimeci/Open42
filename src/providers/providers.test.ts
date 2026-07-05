import { describe, it, expect, vi, afterEach } from "vitest";
import { OpenAIProvider } from "./openai.js";
import { OllamaProvider } from "./ollama.js";
import type { CompletionRequest } from "../types.js";

const REQUEST: CompletionRequest = { system: "s", messages: [{ role: "user", content: "hi" }] };

afterEach(() => vi.unstubAllGlobals());

describe("OpenAIProvider.complete", () => {
  const provider = () =>
    new OpenAIProvider({ apiKey: "sk-secret1234567890", baseUrl: "https://api.example/v1/chat/completions" });

  it("raises an HTTP error and redacts a key echoed in the body", async () => {
    vi.stubGlobal("fetch", async () => new Response("invalid key sk-secret1234567890", { status: 401 }));
    try {
      await provider().complete(REQUEST);
      throw new Error("should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("HTTP 401");
      expect(message).not.toContain("sk-secret1234567890"); // key must not leak
      expect(message).toContain("sk-***");
    }
  });

  it("turns a connection failure into a clear 'could not reach' error", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    await expect(provider().complete(REQUEST)).rejects.toThrow(/could not reach/i);
  });

  it("rejects an empty completion", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }), { status: 200 }),
    );
    await expect(provider().complete(REQUEST)).rejects.toThrow(/empty response/i);
  });
});

describe("OllamaProvider.complete error hints", () => {
  it("tells the user to start Ollama when the server is unreachable", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    await expect(new OllamaProvider({ model: "llama3.1" }).complete(REQUEST)).rejects.toThrow(
      /ollama serve/i,
    );
  });

  it("tells the user to pull the model on a 404", async () => {
    vi.stubGlobal("fetch", async () => new Response("model not found", { status: 404 }));
    await expect(new OllamaProvider({ model: "mistral" }).complete(REQUEST)).rejects.toThrow(
      /ollama pull mistral|not installed/i,
    );
  });
});
