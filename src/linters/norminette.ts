// C sensor: run the 42 norm linter (norminette) and surface its findings as
// objective, deterministic signals. Pure parser + injectable runner, so it is
// fully testable without the binary installed and degrades cleanly when absent.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExecImpl, LintFinding, LinterResult } from "./types.js";

const FILE_LINE = /^(.+?): (OK|Error)!?$/;
const ERROR_LINE = /^Error:\s+([A-Z0-9_]+)\s+\(line:\s*(\d+),\s*col:\s*(\d+)\):\s*(.*)$/;

/**
 * Parse norminette v3 stdout into structured findings. Pure and defensive:
 * unknown/malformed lines are ignored, `: OK!` files contribute nothing.
 */
export function parseNorminette(stdout: string): LintFinding[] {
  const findings: LintFinding[] = [];
  let currentFile = "";
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    const fileMatch = FILE_LINE.exec(line);
    if (fileMatch) {
      currentFile = fileMatch[1]!;
      continue;
    }
    const errMatch = ERROR_LINE.exec(line);
    if (errMatch) {
      findings.push({
        file: currentFile,
        code: errMatch[1]!,
        line: Number(errMatch[2]),
        col: Number(errMatch[3]),
        message: errMatch[4]!.trim(),
      });
    }
  }
  return findings;
}

const defaultExec = promisify(execFile) as unknown as ExecImpl;

/**
 * Run norminette on the given C files. Never throws: a missing binary yields
 * `{ available: false }`, and a non-zero exit (norminette returns non-zero
 * whenever it finds violations) is parsed from stdout.
 */
export async function runNorminette(
  files: readonly string[],
  options: { execImpl?: ExecImpl; cwd?: string } = {},
): Promise<LinterResult> {
  const exec = options.execImpl ?? defaultExec;
  const base = { tool: "norminette", language: "c" } as const;
  try {
    const { stdout } = await exec("norminette", files, { cwd: options.cwd });
    return { ...base, available: true, findings: parseNorminette(stdout) };
  } catch (err) {
    const e = err as { code?: unknown; stdout?: unknown };
    if (e.code === "ENOENT") return { ...base, available: false, findings: [] };
    // norminette exits non-zero when it finds errors, but still writes stdout.
    if (typeof e.stdout === "string") {
      return { ...base, available: true, findings: parseNorminette(e.stdout) };
    }
    // Unknown failure: degrade to "unavailable" rather than crash the CLI.
    return { ...base, available: false, findings: [] };
  }
}
