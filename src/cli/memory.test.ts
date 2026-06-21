import { describe, it, expect, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { saveSession, listSessions, recentSessions, memoryContextBlock, forgetAll } from "./memory.js";

const base = join(tmpdir(), "open42-test-memory");
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe("memory", () => {
  it("saves and lists sessions oldest first", () => {
    saveSession("- worked on recursion", "2026-01-01T10:00:00.000Z", base);
    saveSession("- worked on pointers", "2026-01-02T10:00:00.000Z", base);
    const all = listSessions(base);
    expect(all.length).toBe(2);
    expect(all[0]!.content).toContain("recursion");
    expect(all[1]!.content).toContain("pointers");
  });

  it("recentSessions returns the newest, chronologically", () => {
    saveSession("a", "2026-01-01T10:00:00.000Z", base);
    saveSession("b", "2026-01-02T10:00:00.000Z", base);
    const recent = recentSessions(1, base);
    expect(recent.length).toBe(1);
    expect(recent[0]!.content).toContain("b");
  });

  it("memoryContextBlock is empty when there is nothing", () => {
    expect(memoryContextBlock(3, base)).toBe("");
  });

  it("forgetAll removes everything and reports the count", () => {
    saveSession("x", "2026-01-01T10:00:00.000Z", base);
    saveSession("y", "2026-01-02T10:00:00.000Z", base);
    expect(forgetAll(base)).toBe(2);
    expect(listSessions(base)).toEqual([]);
  });
});
