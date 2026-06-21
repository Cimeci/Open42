import { describe, it, expect } from "vitest";
import { runStructuralEvals, behaviouralChecks } from "./evals.js";

describe("structural evals", () => {
  it("all structural checks pass (routing + guardrail integrity)", () => {
    const report = runStructuralEvals();
    const failures = report.results.filter((r) => !r.ok);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(report.failed).toBe(0);
    expect(report.passed).toBe(report.total);
  });
});

describe("behavioural checks (heuristics)", () => {
  it("flags a reply that dumps a long code solution", () => {
    const dump = "Here:\n```js\n" + Array.from({ length: 10 }, (_, i) => `line${i}`).join("\n") + "\n```";
    const checks = behaviouralChecks(dump);
    expect(checks.find((c) => c.id === "behaviour/no-solution-dump")?.ok).toBe(false);
  });

  it("accepts a short Socratic question", () => {
    const reply = "What do you expect this line to return, and what does it actually return?";
    const checks = behaviouralChecks(reply);
    expect(checks.find((c) => c.id === "behaviour/engages")?.ok).toBe(true);
    expect(checks.find((c) => c.id === "behaviour/no-solution-dump")?.ok).toBe(true);
  });

  it("accepts a firm refusal that redirects without a question mark", () => {
    const reply =
      "As your mentor I won't write it for you. Provide more details and I will guide you step by step.";
    const checks = behaviouralChecks(reply);
    expect(checks.find((c) => c.id === "behaviour/engages")?.ok).toBe(true);
  });
});
