// Python sensor: run flake8 (PEP 8 + pyflakes) and surface its findings as
// objective, deterministic signals. Same shape as the norminette sensor: pure
// parser + injectable runner, testable without the binary and safe when absent.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExecImpl, LintFinding, LinterResult } from "./types.js";

// flake8 default format: `path:line:col: CODE message`
// e.g. `src/app.py:1:1: F401 'os' imported but unused`
const FLAKE8_LINE = /^(.+?):(\d+):(\d+):\s+([A-Z]{1,4}\d+)\s+(.*)$/;

/**
 * Parse flake8 stdout into structured findings. Pure and defensive: any line
 * that does not match the `file:line:col: CODE message` shape is ignored.
 */
export function parseFlake8(stdout: string): LintFinding[] {
  const findings: LintFinding[] = [];
  for (const raw of stdout.split("\n")) {
    const m = FLAKE8_LINE.exec(raw.trim());
    if (!m) continue;
    findings.push({
      file: m[1]!,
      line: Number(m[2]),
      col: Number(m[3]),
      code: m[4]!,
      message: m[5]!.trim(),
    });
  }
  return findings;
}

const defaultExec = promisify(execFile) as unknown as ExecImpl;

/**
 * Run flake8 on the given Python files. Never throws: a missing binary yields
 * `{ available: false }`, and a non-zero exit (flake8 returns 1 when it finds
 * violations) is parsed from stdout.
 */
export async function runFlake8(
  files: readonly string[],
  options: { execImpl?: ExecImpl; cwd?: string } = {},
): Promise<LinterResult> {
  const exec = options.execImpl ?? defaultExec;
  const base = { tool: "flake8", language: "python" } as const;
  try {
    const { stdout } = await exec("flake8", files, { cwd: options.cwd });
    return { ...base, available: true, findings: parseFlake8(stdout) };
  } catch (err) {
    const e = err as { code?: unknown; stdout?: unknown };
    if (e.code === "ENOENT") return { ...base, available: false, findings: [] };
    // flake8 exits 1 when it finds violations, but still writes them to stdout.
    if (typeof e.stdout === "string") {
      return { ...base, available: true, findings: parseFlake8(e.stdout) };
    }
    // Unknown failure: degrade to "unavailable" rather than crash the CLI.
    return { ...base, available: false, findings: [] };
  }
}
