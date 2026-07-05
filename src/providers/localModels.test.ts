import { describe, it, expect } from "vitest";
import {
  parseModelIds,
  dedupeByBaseUrl,
  listModelsAt,
  detectLocalModels,
  type LocalRuntime,
} from "./localModels.js";

describe("parseModelIds", () => {
  it("reads the OpenAI shape { data: [{ id }] }", () => {
    const payload = { object: "list", data: [{ id: "llama3.1" }, { id: "qwen2.5-coder" }] };
    expect(parseModelIds(payload)).toEqual(["llama3.1", "qwen2.5-coder"]);
  });

  it("reads the Ollama /api/tags shape { models: [{ name }] }", () => {
    const payload = { models: [{ name: "llama3.1:latest" }, { name: "mistral" }] };
    expect(parseModelIds(payload)).toEqual(["llama3.1:latest", "mistral"]);
  });

  it("returns [] for malformed payloads", () => {
    expect(parseModelIds(null)).toEqual([]);
    expect(parseModelIds({})).toEqual([]);
    expect(parseModelIds({ data: "nope" })).toEqual([]);
    expect(parseModelIds({ data: [{ nope: 1 }, { id: "" }] })).toEqual([]);
  });
});

describe("dedupeByBaseUrl", () => {
  it("keeps the first runtime per base URL, ignoring trailing slashes", () => {
    const runtimes: LocalRuntime[] = [
      { id: "a", label: "A", baseUrl: "http://localhost:8080/v1" },
      { id: "b", label: "B", baseUrl: "http://localhost:8080/v1/" },
      { id: "c", label: "C", baseUrl: "http://localhost:1234/v1" },
    ];
    expect(dedupeByBaseUrl(runtimes).map((r) => r.id)).toEqual(["a", "c"]);
  });
});

describe("listModelsAt", () => {
  it("parses the models exposed by a reachable endpoint", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ data: [{ id: "phi3" }] }), { status: 200 })) as typeof fetch;
    const models = await listModelsAt("http://localhost:1234/v1", { fetchImpl, timeoutMs: 50 });
    expect(models).toEqual(["phi3"]);
  });

  it("throws when the endpoint answers non-OK", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    await expect(listModelsAt("http://localhost:1234/v1", { fetchImpl, timeoutMs: 50 })).rejects.toThrow();
  });
});

describe("detectLocalModels", () => {
  const runtimes: LocalRuntime[] = [
    { id: "ollama", label: "Ollama", baseUrl: "http://localhost:11434/v1" },
    { id: "lmstudio", label: "LM Studio", baseUrl: "http://localhost:1234/v1" },
  ];

  it("returns detected models from live runtimes and ignores unreachable ones", async () => {
    const fetchImpl = (async (url: string | URL) => {
      const href = String(url);
      if (href === "http://localhost:11434/v1/models") {
        return new Response(JSON.stringify({ data: [{ id: "llama3.1" }, { id: "qwen2.5" }] }), {
          status: 200,
        });
      }
      // LM Studio is down: simulate a connection refused.
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const found = await detectLocalModels({ runtimes, fetchImpl, timeoutMs: 50 });
    expect(found.map((m) => m.model)).toEqual(["llama3.1", "qwen2.5"]);
    expect(found[0]).toMatchObject({
      runtime: "ollama",
      label: "Ollama",
      chatUrl: "http://localhost:11434/v1/chat/completions",
    });
  });

  it("never rejects when every runtime is unreachable", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    await expect(detectLocalModels({ runtimes, fetchImpl, timeoutMs: 50 })).resolves.toEqual([]);
  });
});
