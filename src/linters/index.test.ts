import { describe, it, expect } from "vitest";
import { runLinters, formatFindingsForReview, allFindings } from "./index.js";
import type { ExecImpl } from "./types.js";

const NORM_OUT = [
  "main.c: Error!",
  "Error: LINE_TOO_LONG       (line:  42, col:  81):\tLine too long",
].join("\n");
const FLAKE_OUT = "app.py:1:1: F401 'os' imported but unused";

/** exec stub that answers per tool binary name. */
const execByTool: ExecImpl = async (file) => {
  if (file === "norminette") return { stdout: NORM_OUT };
  if (file === "flake8") return { stdout: FLAKE_OUT };
  return { stdout: "" };
};

describe("runLinters", () => {
  it("runs norminette for C and flake8 for Python based on detected files", async () => {
    const listFiles = async () => ["main.c", "app.py"];
    const run = await runLinters(["."], { listFiles, execImpl: execByTool });
    expect(run.results.map((r) => r.tool).sort()).toEqual(["flake8", "norminette"]);
    expect(allFindings(run)).toHaveLength(2);
  });

  it("only runs the linter for the language actually present (C only)", async () => {
    const listFiles = async () => ["main.c", "libft.h"];
    const run = await runLinters(["."], { listFiles, execImpl: execByTool });
    expect(run.results).toHaveLength(1);
    expect(run.results[0]!.tool).toBe("norminette");
  });

  it("returns no results when no supported files are found", async () => {
    const listFiles = async () => ["README.md", "Makefile"];
    const run = await runLinters(["."], { listFiles, execImpl: execByTool });
    expect(run.results).toHaveLength(0);
  });
});

describe("formatFindingsForReview", () => {
  it("groups findings by tool, names each norm, and forbids fixing the code", async () => {
    const listFiles = async () => ["main.c", "app.py"];
    const run = await runLinters(["."], { listFiles, execImpl: execByTool });
    const block = formatFindingsForReview(run.results);
    expect(block).toContain('tool="norminette"');
    expect(block).toContain('tool="flake8"');
    expect(block).toContain("LINE_TOO_LONG");
    expect(block).toContain("F401");
    expect(block).toMatch(/do not correct|do not paste|fix\s+it\s+themselves/i);
  });
});
