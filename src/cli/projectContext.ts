import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

export const DEFAULT_PROJECT_CONTEXT_PATH = join(homedir(), ".open42", "project-context.json");

interface StoredProjectContext {
  readonly project: string;
  readonly updatedAt: string;
}

function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
}

export function getProjectContext(path: string = DEFAULT_PROJECT_CONTEXT_PATH): string | undefined {
  if (!existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StoredProjectContext>;
    const project = typeof parsed.project === "string" ? parsed.project.trim() : "";
    return project || undefined;
  } catch {
    return undefined;
  }
}

export function setProjectContext(project: string, path: string = DEFAULT_PROJECT_CONTEXT_PATH): string {
  const value = project.trim();
  if (!value) throw new Error("Project context cannot be empty.");
  ensureDir(path);
  const payload: StoredProjectContext = {
    project: value,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(payload, null, 2) + "\n", { mode: 0o600 });
  return value;
}

export function clearProjectContext(path: string = DEFAULT_PROJECT_CONTEXT_PATH): boolean {
  if (!existsSync(path)) return false;
  rmSync(path, { force: true });
  return true;
}

export function projectContextMemoryBlock(project: string | undefined): string {
  if (!project) return "";
  return [
    "# Active 42 project context",
    "",
    "Treat the following as active project constraints to factor into mentoring.",
    "",
    `<project-context>${project}</project-context>`,
  ].join("\n");
}

export function composePromptMemory(memory: string, project: string | undefined): string | undefined {
  const chunks = [memory.trim(), projectContextMemoryBlock(project).trim()].filter((v) => v.length > 0);
  if (chunks.length === 0) return undefined;
  return chunks.join("\n\n");
}
