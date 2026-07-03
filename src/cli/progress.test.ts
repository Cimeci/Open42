import { afterEach, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import {
  autonomyLevel,
  readProgress,
  recordMemorySaved,
  recordMentorRequest,
  recordSelfSolved,
  recordSession,
} from "./progress.js";

const path = join(tmpdir(), "open42-test-progress", "progress.json");

afterEach(() => rmSync(join(tmpdir(), "open42-test-progress"), { recursive: true, force: true }));

describe("progress", () => {
  it("starts empty when no file exists", () => {
    expect(readProgress(path)).toEqual({
      mentorRequests: 0,
      savedMemories: 0,
      selfSolved: 0,
      sessions: 0,
    });
  });

  it("increments counters and persists locally", () => {
    recordSession(path);
    recordMentorRequest(path);
    recordMemorySaved(path);
    recordSelfSolved(path);
    expect(readProgress(path)).toEqual({
      mentorRequests: 1,
      savedMemories: 1,
      selfSolved: 1,
      sessions: 1,
    });
  });

  it("computes an autonomy level summary", () => {
    expect(autonomyLevel({ mentorRequests: 1, savedMemories: 0, selfSolved: 0, sessions: 1 })).toBe("starter");
    expect(autonomyLevel({ mentorRequests: 4, savedMemories: 2, selfSolved: 1, sessions: 2 })).toBe("growing");
    expect(autonomyLevel({ mentorRequests: 10, savedMemories: 3, selfSolved: 8, sessions: 3 })).toBe(
      "autonomous",
    );
  });
});
