// Local learner memory: short, human-readable session summaries under
// ~/.open42/memory/. Stores understanding, never solutions. Fully local.

import { homedir } from "node:os";
import { join } from "node:path";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  rmSync,
} from "node:fs";

export const DEFAULT_MEMORY_DIR = join(homedir(), ".open42", "memory");

function sessionsDir(base: string): string {
  return join(base, "sessions");
}

export interface StoredSession {
  readonly file: string;
  readonly content: string;
}

/** Persist a session summary as a timestamped Markdown file. Returns its path. */
export function saveSession(
  summary: string,
  timestamp: string,
  base: string = DEFAULT_MEMORY_DIR,
): string {
  const dir = sessionsDir(base);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const safe = timestamp.replace(/[:.]/g, "-");
  const file = join(dir, `${safe}.md`);
  const body = `# Session ${timestamp}\n\n${summary.trim()}\n`;
  writeFileSync(file, body, { mode: 0o600 });
  return file;
}

/** All stored sessions, oldest first. */
export function listSessions(base: string = DEFAULT_MEMORY_DIR): StoredSession[] {
  const dir = sessionsDir(base);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ file: join(dir, f), content: readFileSync(join(dir, f), "utf8").trim() }));
}

/** The most recent `n` sessions, newest last (chronological). */
export function recentSessions(n: number, base: string = DEFAULT_MEMORY_DIR): StoredSession[] {
  const all = listSessions(base);
  return all.slice(Math.max(0, all.length - n));
}

/** A compact block of recent summaries for prompt injection, or "" if none. */
export function memoryContextBlock(n = 3, base: string = DEFAULT_MEMORY_DIR): string {
  const recent = recentSessions(n, base);
  if (recent.length === 0) return "";
  return recent.map((s) => s.content).join("\n\n");
}

/** Delete all stored memory. Returns the number of session files removed. */
export function forgetAll(base: string = DEFAULT_MEMORY_DIR): number {
  const count = listSessions(base).length;
  if (existsSync(base)) rmSync(base, { recursive: true, force: true });
  return count;
}
