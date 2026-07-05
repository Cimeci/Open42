import { describe, it, expect } from "vitest";
import { composeSystemPrompt, composeMentorPrompt, ALL_DOMAINS } from "./prompts.js";
import { BUILTIN_MENTORS } from "./mentors.js";

describe("composeMentorPrompt per-turn instructions", () => {
  const tutor = BUILTIN_MENTORS.find((m) => m.id === "tutor")!;

  it("appends per-turn extraInstructions (used by /verify)", () => {
    const prompt = composeMentorPrompt(tutor, { extraInstructions: "ZZZ-PER-TURN-MARKER" });
    expect(prompt).toContain("ZZZ-PER-TURN-MARKER");
  });

  it("omits them when none are given", () => {
    expect(composeMentorPrompt(tutor, {})).not.toContain("ZZZ-PER-TURN-MARKER");
  });
});

describe("composeSystemPrompt", () => {
  it("always includes the persona, guardrails, method, and calibration", () => {
    const prompt = composeSystemPrompt();
    expect(prompt).toContain("Maïeutique");
    expect(prompt).toContain("Never just hand over an answer to copy.");
    expect(prompt).toContain("The Socratic loop");
    expect(prompt).toContain("Zone of Proximal Development");
  });

  it("enables all four domains by default", () => {
    const prompt = composeSystemPrompt();
    expect(prompt).toContain("Guided debugging");
    expect(prompt).toContain("Reasoning & problem-solving");
    expect(prompt).toContain("Architecture & design");
    expect(prompt).toContain("Code review");
  });

  it("includes only the requested domains", () => {
    const prompt = composeSystemPrompt({ domains: ["debugging"] });
    expect(prompt).toContain("Guided debugging");
    expect(prompt).not.toContain("Architecture & design");
  });

  it("includes peer-learning and 42-context when requested", () => {
    const prompt = composeSystemPrompt({ domains: ["peer-learning", "42-context"] });
    expect(prompt).toContain("Domain - Peer learning");
    expect(prompt).toContain("Domain - 42 context");
  });

  it("keeps the canonical domain order regardless of input order", () => {
    const prompt = composeSystemPrompt({ domains: ["review", "debugging"] });
    expect(prompt.indexOf("Guided debugging")).toBeLessThan(prompt.indexOf("Code review"));
  });

  it("adds no rigor modifier for graduated (the default baseline)", () => {
    expect(composeSystemPrompt({ rigor: "graduated" })).not.toContain("# Rigor:");
    expect(composeSystemPrompt()).not.toContain("# Rigor:");
  });

  it("adds a rigor modifier for strict and adaptive", () => {
    expect(composeSystemPrompt({ rigor: "strict" })).toContain("# Rigor: strict");
    expect(composeSystemPrompt({ rigor: "adaptive" })).toContain("# Rigor: adaptive");
  });

  it("forces a language when requested", () => {
    expect(composeSystemPrompt({ language: "français" })).toContain("Always respond in français.");
  });

  it("appends extra instructions", () => {
    const prompt = composeSystemPrompt({ extraInstructions: "Focus on web projects." });
    expect(prompt).toContain("Focus on web projects.");
  });

  it("exposes all four coding domains as the canonical default list", () => {
    expect(ALL_DOMAINS).toEqual(["debugging", "reasoning", "architecture", "review"]);
  });
});
