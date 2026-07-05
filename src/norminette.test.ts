import { describe, it, expect } from "vitest";
import {
  parseNorminette,
  runNorminette,
  formatFindingsForReview,
  type ExecImpl,
} from "./norminette.js";

const SAMPLE = [
  "main.c: Error!",
  "Error: INVALID_HEADER      (line:   1, col:   1):\tMissing or invalid 42 header",
  "Error: LINE_TOO_LONG       (line:  42, col:  81):\tLine too long",
  "utils.c: OK!",
  "ft_split.c: Error!",
  "Error: TOO_MANY_FUNCS      (line:   0, col:   0):\tToo many functions in file",
].join("\n");

describe("parseNorminette", () => {
  it("extracts findings and attaches them to the right file", () => {
    const findings = parseNorminette(SAMPLE);
    expect(findings).toHaveLength(3);
    expect(findings[0]).toEqual({
      file: "main.c",
      code: "INVALID_HEADER",
      line: 1,
      col: 1,
      message: "Missing or invalid 42 header",
    });
    expect(findings[1]).toMatchObject({ file: "main.c", code: "LINE_TOO_LONG", line: 42, col: 81 });
    expect(findings[2]).toMatchObject({ file: "ft_split.c", code: "TOO_MANY_FUNCS" });
  });

  it("ignores OK files and malformed lines, and returns [] for empty output", () => {
    expect(parseNorminette("clean.c: OK!\nsome noise line\n")).toEqual([]);
    expect(parseNorminette("")).toEqual([]);
  });
});

describe("runNorminette", () => {
  const REQUEST = ["."];

  it("parses stdout from a successful run", async () => {
    const execImpl: ExecImpl = async () => ({ stdout: SAMPLE, stderr: "" });
    const result = await runNorminette(REQUEST, { execImpl });
    expect(result.available).toBe(true);
    expect(result.findings).toHaveLength(3);
  });

  it("still parses stdout when norminette exits non-zero (norm errors present)", async () => {
    const execImpl: ExecImpl = async () => {
      const err = Object.assign(new Error("exit 1"), { code: 1, stdout: SAMPLE });
      throw err;
    };
    const result = await runNorminette(REQUEST, { execImpl });
    expect(result.available).toBe(true);
    expect(result.findings).toHaveLength(3);
  });

  it("reports unavailable (no crash) when the binary is missing", async () => {
    const execImpl: ExecImpl = async () => {
      throw Object.assign(new Error("not found"), { code: "ENOENT" });
    };
    const result = await runNorminette(REQUEST, { execImpl });
    expect(result).toEqual({ available: false, findings: [] });
  });
});

describe("formatFindingsForReview", () => {
  it("wraps findings in read-only markers with a no-fix instruction", () => {
    const block = formatFindingsForReview(parseNorminette(SAMPLE));
    expect(block).toContain("<norminette-findings>");
    expect(block).toContain("INVALID_HEADER");
    expect(block).toMatch(/do not correct|do not paste|fix (it|them) themselves/i);
  });
});
