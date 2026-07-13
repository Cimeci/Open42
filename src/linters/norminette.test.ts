import { describe, it, expect } from "vitest";
import { parseNorminette, runNorminette } from "./norminette.js";
import type { ExecImpl } from "./types.js";

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
  const FILES = ["main.c"];

  it("parses stdout from a successful run and tags it c/norminette", async () => {
    const execImpl: ExecImpl = async () => ({ stdout: SAMPLE, stderr: "" });
    const result = await runNorminette(FILES, { execImpl });
    expect(result).toMatchObject({ tool: "norminette", language: "c", available: true });
    expect(result.findings).toHaveLength(3);
  });

  it("still parses stdout when norminette exits non-zero (norm errors present)", async () => {
    const execImpl: ExecImpl = async () => {
      throw Object.assign(new Error("exit 1"), { code: 1, stdout: SAMPLE });
    };
    const result = await runNorminette(FILES, { execImpl });
    expect(result.available).toBe(true);
    expect(result.findings).toHaveLength(3);
  });

  it("reports unavailable (no crash) when the binary is missing", async () => {
    const execImpl: ExecImpl = async () => {
      throw Object.assign(new Error("not found"), { code: "ENOENT" });
    };
    const result = await runNorminette(FILES, { execImpl });
    expect(result).toEqual({ tool: "norminette", language: "c", available: false, findings: [] });
  });
});
