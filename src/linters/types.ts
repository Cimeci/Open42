// Shared types for the deterministic norm/lint sensors. Each sensor runs a real
// linter (norminette for C, flake8 for Python) and surfaces objective findings;
// the reviewer mentor turns them into Socratic questions and never fixes code.

export type Language = "c" | "python";
export type LinterTool = "norminette" | "flake8";

export interface LintFinding {
  readonly file: string;
  readonly code: string;
  readonly line: number;
  readonly col: number;
  readonly message: string;
}

export interface LinterResult {
  readonly tool: LinterTool;
  readonly language: Language;
  /** False when the tool binary is not installed / not on PATH. */
  readonly available: boolean;
  readonly findings: readonly LintFinding[];
}

/** Minimal shape of a promisified execFile, injectable for tests. */
export type ExecImpl = (
  file: string,
  args: readonly string[],
  options: { cwd?: string },
) => Promise<{ stdout: string; stderr?: string }>;

/** Human-facing name of the norm each tool enforces (used in the review block). */
export const NORM_LABEL: Record<LinterTool, string> = {
  norminette: "the 42 norm (C)",
  flake8: "PEP 8 (Python, flake8)",
};

/** Install hint surfaced when a tool is missing. */
export const INSTALL_HINT: Record<LinterTool, string> = {
  norminette: "pip install norminette",
  flake8: "pip install flake8",
};
