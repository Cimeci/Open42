import { describe, it, expect } from "vitest";
import { detectLanguage, groupByLanguage } from "./detect.js";

describe("detectLanguage", () => {
  it("maps C and Python extensions (case-insensitive)", () => {
    expect(detectLanguage("main.c")).toBe("c");
    expect(detectLanguage("libft/ft_split.h")).toBe("c");
    expect(detectLanguage("app.py")).toBe("python");
    expect(detectLanguage("dir/Nested.PY")).toBe("python");
  });

  it("returns null for unsupported files", () => {
    expect(detectLanguage("README.md")).toBeNull();
    expect(detectLanguage("Makefile")).toBeNull();
    expect(detectLanguage("script.js")).toBeNull();
  });
});

describe("groupByLanguage", () => {
  it("buckets files by language and drops unsupported ones", () => {
    const groups = groupByLanguage(["a.c", "b.h", "c.py", "d.txt"]);
    expect(groups.get("c")).toEqual(["a.c", "b.h"]);
    expect(groups.get("python")).toEqual(["c.py"]);
    expect([...groups.keys()]).toHaveLength(2);
  });

  it("returns an empty map when nothing is supported", () => {
    expect(groupByLanguage(["notes.md", "data.json"]).size).toBe(0);
  });
});
