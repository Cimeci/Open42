import { describe, it, expect } from "vitest";
import { Open42 } from "./open42.js";
import { MentorRegistry, BUILTIN_MENTORS } from "./mentors.js";
import { HeuristicRouter, LlmRouter } from "./router.js";
import { composeMentorPrompt } from "./prompts.js";
import type { CompletionRequest, CompletionResult, Provider } from "./types.js";

class CapturingProvider implements Provider {
  readonly name = "capture";
  lastRequest: CompletionRequest | null = null;
  constructor(private readonly reply = "What do you expect to happen?") {}
  async complete(request: CompletionRequest): Promise<CompletionResult> {
    this.lastRequest = request;
    return { content: this.reply, raw: { ok: true } };
  }
}

describe("MentorRegistry", () => {
  it("preloads the four built-in mentors", () => {
    const ids = new MentorRegistry().list().map((m) => m.id);
    expect(ids).toEqual(["tutor", "architect", "reviewer", "ai-coach"]);
  });

  it("registers a custom mentor (extensible architecture)", () => {
    const registry = new MentorRegistry();
    registry.register({
      id: "test-coach",
      title: "Testing Coach",
      description: "Helps you write your own tests.",
      prompt: "# Custom\nFocus on testing.",
    });
    expect(registry.require("test-coach").title).toBe("Testing Coach");
  });

  it("rejects a mentor with neither domains nor a custom prompt", () => {
    expect(() =>
      new MentorRegistry().register({ id: "empty", title: "X", description: "Y" }),
    ).toThrow(/at least one domain or a custom prompt/);
  });

  it("throws a helpful error for an unknown mentor", () => {
    expect(() => new MentorRegistry().require("nope")).toThrow(/no mentor "nope"/);
  });
});

describe("HeuristicRouter", () => {
  const mentors = BUILTIN_MENTORS;

  it("routes a bug report to the tutor", () => {
    const id = new HeuristicRouter("tutor").route(
      [{ role: "student", content: "I get an undefined error and I'm stuck." }],
      mentors,
    );
    expect(id).toBe("tutor");
  });

  it("routes a design question to the architect", () => {
    const id = new HeuristicRouter("tutor").route(
      [{ role: "student", content: "Should I use this pattern for my architecture?" }],
      mentors,
    );
    expect(id).toBe("architect");
  });

  it("routes an AI-usage question to the ai-coach", () => {
    const id = new HeuristicRouter("tutor").route(
      [{ role: "student", content: "How do I verify the code ChatGPT generated?" }],
      mentors,
    );
    expect(id).toBe("ai-coach");
  });

  it("falls back when nothing matches", () => {
    const id = new HeuristicRouter("tutor").route(
      [{ role: "student", content: "hello there" }],
      mentors,
    );
    expect(id).toBe("tutor");
  });

  it("stays on the current mentor when nothing matches (sticky)", () => {
    const id = new HeuristicRouter("tutor").route(
      [{ role: "student", content: "hmm, not sure, what do you think?" }],
      mentors,
      "architect",
    );
    expect(id).toBe("architect");
  });
});

describe("LlmRouter", () => {
  it("uses the model's choice when it names a valid mentor", async () => {
    const provider = new CapturingProvider("ai-coach");
    const id = await new LlmRouter(provider).route(
      [{ role: "student", content: "anything" }],
      BUILTIN_MENTORS,
    );
    expect(id).toBe("ai-coach");
  });

  it("falls back when the model returns an unknown id", async () => {
    const provider = new CapturingProvider("banana");
    const id = await new LlmRouter(provider, "reviewer").route(
      [{ role: "student", content: "anything" }],
      BUILTIN_MENTORS,
    );
    expect(id).toBe("reviewer");
  });

  it("prefers an exact id over a substring match", async () => {
    const overlapping = [
      { id: "review", title: "A", description: "d", prompt: "p" },
      { id: "reviewer", title: "B", description: "d", prompt: "p" },
    ];
    const id = await new LlmRouter(new CapturingProvider("reviewer")).route(
      [{ role: "student", content: "x" }],
      overlapping,
    );
    expect(id).toBe("reviewer");
  });
});

describe("Open42 orchestrator", () => {
  it("requires a provider", () => {
    // @ts-expect-error - exercising the runtime guard
    expect(() => new Open42({})).toThrow(/provider is required/);
  });

  it("routes to a mentor and annotates the reply", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider });
    const reply = await open42.respond([
      { role: "student", content: "My recursion returns undefined and I'm stuck." },
    ]);
    expect(reply.mentor).toBe("tutor");
    expect(provider.lastRequest?.system).toContain("Mentor role: Socratic Tutor");
  });

  it("honours an explicit mentor selection", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider });
    const reply = await open42.respond(
      [{ role: "student", content: "anything at all" }],
      { mentor: "ai-coach" },
    );
    expect(reply.mentor).toBe("ai-coach");
    expect(provider.lastRequest?.system).toContain("AI literacy");
  });

  it("always injects the independence pillar into every mentor", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider });
    await open42.respond([{ role: "student", content: "review my code please" }]);
    expect(provider.lastRequest?.system).toContain("Using AI without depending on it");
  });

  it("supports custom mentors end to end", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider }).registerMentor({
      id: "sec-coach",
      title: "Security Coach",
      description: "Helps you find security issues in your own code.",
      prompt: "# Security focus\nGuide the student to spot vulnerabilities themselves.",
    });
    const reply = await open42.respond(
      [{ role: "student", content: "anything" }],
      { mentor: "sec-coach" },
    );
    expect(reply.mentor).toBe("sec-coach");
    expect(provider.lastRequest?.system).toContain("Security focus");
  });
});

class StreamingProvider implements Provider {
  readonly name = "streaming";
  constructor(private readonly chunks: string[]) {}
  async complete(): Promise<CompletionResult> {
    return { content: this.chunks.join("") };
  }
  async stream(_req: CompletionRequest, onDelta: (d: string) => void): Promise<CompletionResult> {
    for (const c of this.chunks) onDelta(c);
    return { content: this.chunks.join("") };
  }
}

describe("Open42.respondStream", () => {
  it("streams deltas and reports the mentor", async () => {
    const provider = new StreamingProvider(["Quelle ", "est ", "ton ", "hypothèse ?"]);
    const open42 = new Open42({ provider });
    const deltas: string[] = [];
    let mentor = "";
    const reply = await open42.respondStream(
      [{ role: "student", content: "j'ai une erreur et je suis bloqué" }],
      {},
      { onMentor: (id) => (mentor = id), onText: (d) => deltas.push(d) },
    );
    expect(deltas).toEqual(["Quelle ", "est ", "ton ", "hypothèse ?"]);
    expect(reply.content).toBe("Quelle est ton hypothèse ?");
    expect(mentor).toBe("tutor");
    expect(reply.mentor).toBe("tutor");
  });

  it("falls back to a single chunk when the provider can't stream", async () => {
    const provider = new CapturingProvider("Une seule réponse.");
    const open42 = new Open42({ provider });
    const deltas: string[] = [];
    const reply = await open42.respondStream(
      [{ role: "student", content: "anything" }],
      { mentor: "reviewer" },
      { onText: (d) => deltas.push(d) },
    );
    expect(deltas).toEqual(["Une seule réponse."]);
    expect(reply.mentor).toBe("reviewer");
  });
});

describe("Open42 memory", () => {
  it("injects the learner memory into every mentor prompt", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider, memory: "- worked on recursion, still shaky" });
    await open42.respond([{ role: "student", content: "hello" }]);
    expect(provider.lastRequest?.system).toContain("What I remember about this learner");
    expect(provider.lastRequest?.system).toContain("worked on recursion, still shaky");
  });

  it("summarize asks the provider and returns the note", async () => {
    const provider = new CapturingProvider("- worked on loops\n- still unsure about scope");
    const open42 = new Open42({ provider });
    const summary = await open42.summarize([
      { role: "student", content: "why is x undefined?" },
      { role: "mentor", content: "what scope is x declared in?" },
    ]);
    expect(summary).toContain("worked on loops");
    // The summarizer prompt, not a mentor prompt, drives the call.
    expect(provider.lastRequest?.system).toContain("Session summary task");
  });
});

describe("Open42.setLanguage", () => {
  it("forces the reply language into the system prompt", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider });
    open42.setLanguage("français");
    await open42.respond([{ role: "student", content: "bonjour" }]);
    expect(provider.lastRequest?.system).toContain("Always respond in français.");
  });

  it("clears the forced language when set to undefined", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider, language: "français" });
    open42.setLanguage(undefined);
    await open42.respond([{ role: "student", content: "hello" }]);
    expect(provider.lastRequest?.system).not.toContain("Always respond in");
  });
});

describe("sticky routing", () => {
  it("stays with the current mentor when a follow-up has no clear signal", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider });
    // First turn clearly routes to the architect.
    const first = await open42.respond([
      { role: "student", content: "How should I structure my architecture?" },
    ]);
    expect(first.mentor).toBe("architect");
    // Ambiguous follow-up: should stay on architect, not jump to the tutor.
    const second = await open42.respond([
      { role: "student", content: "How should I structure my architecture?" },
      { role: "mentor", content: "What are you optimising for?" },
      { role: "student", content: "Hmm, I'm not sure, what do you think?" },
    ]);
    expect(second.mentor).toBe("architect");
  });
});

describe("context trimming", () => {
  it("sends at most maxMessages to the provider", async () => {
    const provider = new CapturingProvider();
    const open42 = new Open42({ provider, maxMessages: 4 });
    const transcript: Array<{ role: "student" | "mentor"; content: string }> = [];
    for (let i = 0; i < 5; i++) {
      transcript.push({ role: "student", content: `q${i}` });
      transcript.push({ role: "mentor", content: `a${i}` });
    }
    transcript.push({ role: "student", content: "latest" });
    await open42.respond(transcript);
    const sent = provider.lastRequest!.messages;
    expect(sent.length).toBeLessThanOrEqual(4);
    expect(sent[0]!.role).toBe("user"); // still starts on a student turn
    expect(sent[sent.length - 1]!.content).toBe("latest");
  });
});

describe("compact prompt style", () => {
  it("is much shorter than full but keeps the core guardrail", async () => {
    const provider = new CapturingProvider();
    const compact = new Open42({ provider, promptStyle: "compact" });
    await compact.respond([{ role: "student", content: "my code crashes" }]);
    const compactPrompt = provider.lastRequest!.system;

    const full = new Open42({ provider: new CapturingProvider() });
    const fullPrompt = full.promptFor("tutor");

    expect(compactPrompt).toContain("Socratic coding mentor");
    expect(compactPrompt.toLowerCase()).toContain("never");
    expect(compactPrompt.length).toBeLessThan(fullPrompt.length / 2);
  });
});

describe("composeMentorPrompt", () => {
  it("prepends the shared foundation before the role", () => {
    const mentor = BUILTIN_MENTORS.find((m) => m.id === "architect")!;
    const prompt = composeMentorPrompt(mentor);
    expect(prompt.indexOf("Never just hand over an answer to copy.")).toBeLessThan(
      prompt.indexOf("Mentor role: Architecture Mentor"),
    );
    expect(prompt).toContain("Architecture & design");
  });
});
