import { describe, it, expect } from "vitest";
import { slashCommands, filterCommands } from "./commands.js";

describe("slashCommands", () => {
  it("localizes summaries and flags argument-required commands", () => {
    const en = slashCommands("en");
    const help = en.find((c) => c.name === "help")!;
    expect(help.summary).toBe("show help");
    expect(help.requiresArg).toBe(false);

    const mentor = en.find((c) => c.name === "mentor")!;
    expect(mentor.requiresArg).toBe(true);
    expect(mentor.hint).toBe("<id>");

    const fr = slashCommands("fr");
    expect(fr.find((c) => c.name === "help")!.summary).toBe("affiche l'aide");
  });

  it("exposes every command the chat handles", () => {
    const names = slashCommands("en").map((c) => c.name);
    for (const expected of ["help", "model", "verify", "norm", "lang", "logout", "project", "quit"]) {
      expect(names).toContain(expected);
    }
  });
});

describe("filterCommands", () => {
  const cmds = slashCommands("en");

  it("returns everything for an empty query", () => {
    expect(filterCommands(cmds, "")).toHaveLength(cmds.length);
  });

  it("matches by name prefix, keeping catalogue order", () => {
    const names = filterCommands(cmds, "me").map((c) => c.name);
    expect(names).toEqual(["mentors", "mentor", "memory"]);
  });

  it("narrows as the query grows", () => {
    expect(filterCommands(cmds, "men").map((c) => c.name)).toEqual(["mentors", "mentor"]);
    expect(filterCommands(cmds, "mento").map((c) => c.name)).toEqual(["mentors", "mentor"]);
  });

  it("floats an exact match to the top (typing /mentor selects mentor, not mentors)", () => {
    expect(filterCommands(cmds, "mentor").map((c) => c.name)).toEqual(["mentor", "mentors"]);
    expect(filterCommands(cmds, "help").map((c) => c.name)).toEqual(["help"]);
  });

  it("is case-insensitive and returns nothing for an unknown query", () => {
    expect(filterCommands(cmds, "HELP").map((c) => c.name)).toEqual(["help"]);
    expect(filterCommands(cmds, "zzz")).toEqual([]);
  });
});
