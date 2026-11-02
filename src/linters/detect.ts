// Language detection by file extension, plus the filesystem walk used to decide
// which linters to run. Detection is pure and testable; the walk is injectable.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Language } from "./types.js";

const EXT_LANGUAGE: Record<string, Language> = {
  ".c": "c",
  ".h": "c",
  ".py": "python",
};

/** Map a single path to a language by extension, or null if unsupported. */
export function detectLanguage(file: string): Language | null {
  return EXT_LANGUAGE[path.extname(file).toLowerCase()] ?? null;
}

/** Group files by detected language; unsupported files are dropped. */
export function groupByLanguage(
  files: readonly string[],
): Map<Language, string[]> {
  const groups = new Map<Language, string[]>();
  for (const file of files) {
    const language = detectLanguage(file);
    if (!language) continue;
    const bucket = groups.get(language) ?? [];
    bucket.push(file);
    groups.set(language, bucket);
  }
  return groups;
}

/** Signature of the file lister, injectable so the dispatcher is testable. */
export type ListFiles = (paths: readonly string[]) => Promise<string[]>;

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  "venv",
]);
const MAX_DEPTH = 8;

async function walk(target: string, depth: number, out: string[]): Promise<void> {
  let stat;
  try {
    stat = await fs.stat(target);
  } catch {
    return; // path does not exist / not readable — skip silently
  }
  if (stat.isFile()) {
    out.push(target);
    return;
  }
  if (!stat.isDirectory() || depth > MAX_DEPTH) return;
  const entries = await fs.readdir(target, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && (IGNORE_DIRS.has(entry.name) || entry.name.startsWith("."))) {
      continue;
    }
    await walk(path.join(target, entry.name), depth + 1, out);
  }
}

/**
 * Default lister: expand each path (file → itself, directory → recursive scan,
 * ignoring vendored/build/hidden dirs) into a flat list of files.
 */
export const defaultListFiles: ListFiles = async (paths) => {
  const out: string[] = [];
  for (const p of paths) await walk(p, 0, out);
  return out;
};
