import { afterEach, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import {
  clearProjectContext,
  composePromptMemory,
  getProjectContext,
  projectContextMemoryBlock,
  setProjectContext,
} from "./projectContext.js";

const path = join(tmpdir(), "open42-test-project-context", "project-context.json");

afterEach(() => rmSync(join(tmpdir(), "open42-test-project-context"), { recursive: true, force: true }));

describe("project context", () => {
  it("stores and loads the active project context", () => {
    setProjectContext("minishell", path);
    expect(getProjectContext(path)).toBe("minishell");
  });

  it("clears the active project context", () => {
    setProjectContext("libft", path);
    expect(clearProjectContext(path)).toBe(true);
    expect(getProjectContext(path)).toBeUndefined();
  });

  it("builds project context memory blocks", () => {
    const block = projectContextMemoryBlock("push_swap");
    expect(block).toContain("Active 42 project context");
    expect(block).toContain("push_swap");
  });

  it("composes prompt memory with local memory + project context", () => {
    const memory = composePromptMemory("- worked on parsing", "minitalk");
    expect(memory).toContain("worked on parsing");
    expect(memory).toContain("minitalk");
  });
});
