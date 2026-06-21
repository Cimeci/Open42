import { describe, it, expect } from "vitest";
import { Maieutic } from "./harness.js";
import type { CompletionRequest, CompletionResult, Provider } from "./types.js";

/** A fake provider that records the last request and returns a fixed reply. */
class FakeProvider implements Provider {
  readonly name = "fake";
  lastRequest: CompletionRequest | null = null;

  constructor(private readonly reply = "What do you expect this line to do?") {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    this.lastRequest = request;
    return { content: this.reply, raw: { ok: true } };
  }
}

describe("Maieutic", () => {
  it("requires a provider", () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => new Maieutic({})).toThrow(/provider is required/);
  });

  it("builds a system prompt at construction time", () => {
    const mentor = new Maieutic({ provider: new FakeProvider() });
    expect(mentor.prompt).toContain("Maïeutique");
  });

  it("passes the system prompt to the provider", async () => {
    const provider = new FakeProvider();
    const mentor = new Maieutic({ provider });
    await mentor.respond([{ role: "student", content: "It returns undefined." }]);
    expect(provider.lastRequest?.system).toContain("Never just hand over an answer to copy.");
  });

  it("maps student/mentor roles to user/assistant", async () => {
    const provider = new FakeProvider();
    const mentor = new Maieutic({ provider });
    await mentor.respond([
      { role: "student", content: "How do I start?" },
      { role: "mentor", content: "What does a correct answer look like?" },
      { role: "student", content: "An array of names." },
    ]);
    expect(provider.lastRequest?.messages).toEqual([
      { role: "user", content: "How do I start?" },
      { role: "assistant", content: "What does a correct answer look like?" },
      { role: "user", content: "An array of names." },
    ]);
  });

  it("returns the mentor's reply", async () => {
    const provider = new FakeProvider("Read me the error message — which line?");
    const mentor = new Maieutic({ provider });
    const reply = await mentor.respond([{ role: "student", content: "Help" }]);
    expect(reply.content).toBe("Read me the error message — which line?");
    expect(reply.raw).toEqual({ ok: true });
  });

  it("rejects an empty transcript", async () => {
    const mentor = new Maieutic({ provider: new FakeProvider() });
    await expect(mentor.respond([])).rejects.toThrow(/empty/);
  });

  it("rejects a transcript that does not end on a student turn", async () => {
    const mentor = new Maieutic({ provider: new FakeProvider() });
    await expect(
      mentor.respond([{ role: "mentor", content: "What have you tried?" }]),
    ).rejects.toThrow(/end with a student message/);
  });
});
