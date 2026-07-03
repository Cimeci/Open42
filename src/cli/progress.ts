import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export const DEFAULT_PROGRESS_PATH = join(homedir(), ".open42", "progress.json");

export interface ProgressState {
  readonly mentorRequests: number;
  readonly savedMemories: number;
  readonly selfSolved: number;
  readonly sessions: number;
}

export type AutonomyLevel = "starter" | "growing" | "autonomous";

const EMPTY_PROGRESS: ProgressState = {
  mentorRequests: 0,
  savedMemories: 0,
  selfSolved: 0,
  sessions: 0,
};

function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function normalize(input: Partial<ProgressState> | null | undefined): ProgressState {
  return {
    mentorRequests: Number.isFinite(input?.mentorRequests) ? Math.max(0, input!.mentorRequests as number) : 0,
    savedMemories: Number.isFinite(input?.savedMemories) ? Math.max(0, input!.savedMemories as number) : 0,
    selfSolved: Number.isFinite(input?.selfSolved) ? Math.max(0, input!.selfSolved as number) : 0,
    sessions: Number.isFinite(input?.sessions) ? Math.max(0, input!.sessions as number) : 0,
  };
}

export function readProgress(path: string = DEFAULT_PROGRESS_PATH): ProgressState {
  if (!existsSync(path)) return EMPTY_PROGRESS;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<ProgressState>;
    return normalize(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function writeProgress(
  state: Partial<ProgressState>,
  path: string = DEFAULT_PROGRESS_PATH,
): ProgressState {
  ensureDir(path);
  const next = normalize(state);
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
  return next;
}

function bump(
  key: keyof ProgressState,
  delta = 1,
  path: string = DEFAULT_PROGRESS_PATH,
): ProgressState {
  const current = readProgress(path);
  return writeProgress({ ...current, [key]: current[key] + delta }, path);
}

export function recordSession(path?: string): ProgressState {
  return bump("sessions", 1, path);
}

export function recordMentorRequest(path?: string): ProgressState {
  return bump("mentorRequests", 1, path);
}

export function recordMemorySaved(path?: string): ProgressState {
  return bump("savedMemories", 1, path);
}

export function recordSelfSolved(path?: string): ProgressState {
  return bump("selfSolved", 1, path);
}

export function autonomyLevel(state: ProgressState): AutonomyLevel {
  if (state.selfSolved >= 8 && state.sessions >= 3) return "autonomous";
  if (state.selfSolved >= 3 || state.savedMemories >= 2) return "growing";
  return "starter";
}
