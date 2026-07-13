import { describe, it, expect } from "vitest";
import { parseFlake8, runFlake8 } from "./flake8.js";
import type { ExecImpl } from "./types.js";

const SAMPLE = [
  "src/app.py:1:1: F401 'os' imported but unused",
  "src/app.py:10:80: E501 line too long (85 > 79 characters)",
  "tests/test_app.py:3:1: E302 expected 2 blank lines, found 1",
].join("\n");

describe("parseFlake8", () => {
  it("extracts file, line, col, code and message from each finding", () => {
    const findings = parseFlake8(SAMPLE);
    expect(findings).toHaveLength(3);
    expect(findings[0]).toEqual({
      file: "src/app.py",
      line: 1,
      col: 1,
      code: "F401",
      message: "'os' imported but unused",
    });
    expect(findings[1]).toMatchObject({ code: "E501", line: 10, col: 80 });
    expect(findings[2]).toMatchObject({ file: "tests/test_app.py", code: "E302" });
  });

  it("ignores malformed lines and returns [] for empty output", () => {
    expect(parseFlake8("this is not a finding\n")).toEqual([]);
    expect(parseFlake8("")).toEqual([]);
  });
});

describe("runFlake8", () => {
  const FILES = ["app.py"];

  it("parses stdout from a successful run and tags it python/flake8", async () => {
    const execImpl: ExecImpl = async () => ({ stdout: SAMPLE });
    const result = await runFlake8(FILES, { execImpl });
    expect(result).toMatchObject({ tool: "flake8", language: "python", available: true });
    expect(result.findings).toHaveLength(3);
  });

  it("still parses stdout when flake8 exits non-zero (violations present)", async () => {
    const execImpl: ExecImpl = async () => {
      throw Object.assign(new Error("exit 1"), { code: 1, stdout: SAMPLE });
    };
    const result = await runFlake8(FILES, { execImpl });
    expect(result.available).toBe(true);
    expect(result.findings).toHaveLength(3);
  });

  it("reports unavailable (no crash) when the binary is missing", async () => {
    const execImpl: ExecImpl = async () => {
      throw Object.assign(new Error("not found"), { code: "ENOENT" });
    };
    const result = await runFlake8(FILES, { execImpl });
    expect(result).toEqual({ tool: "flake8", language: "python", available: false, findings: [] });
  });
});
