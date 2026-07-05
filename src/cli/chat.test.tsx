import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { Chat } from "./components/Chat.js";
import { Banner } from "./components/Banner.js";
import { Onboarding } from "./components/Onboarding.js";
import { Open42 } from "../open42.js";
import type { CompletionResult, Provider } from "../types.js";

const fakeProvider: Provider = {
  name: "fake",
  async complete(): Promise<CompletionResult> {
    return { content: "What do you expect to happen?" };
  },
};

describe("TUI rendering (no TTY required)", () => {
  it("renders the banner", () => {
    const { lastFrame } = render(<Banner />);
    expect(lastFrame()).toContain("Learn by understanding");
  });

  it("shows a connection screen with token and local modes (en)", () => {
    const { lastFrame } = render(<Onboarding onDone={() => {}} initialLang="en" />);
    expect(lastFrame()).toContain("No AI connected");
    expect(lastFrame()).toContain("Paste an API key");
    expect(lastFrame()).toContain("Local model");
    expect(lastFrame()).not.toContain("Connect via the web");
  });

  it("renders a localized chat input prompt", () => {
    const open42 = new Open42({ provider: fakeProvider });
    const fr = render(<Chat open42={open42} initialLang="fr" />);
    expect(fr.lastFrame()).toContain("Pose ta question…");
    const en = render(<Chat open42={open42} initialLang="en" />);
    expect(en.lastFrame()).toContain("Ask your question…");
  });

  it("opens and filters the slash-command palette while typing", async () => {
    const delay = () => new Promise((r) => setTimeout(r, 20));
    const open42 = new Open42({ provider: fakeProvider });
    const { stdin, lastFrame } = render(<Chat open42={open42} demo initialLang="en" />);

    stdin.write("/");
    await delay();
    expect(lastFrame()).toContain("/help");
    expect(lastFrame()).toContain("/model");

    stdin.write("lo"); // now "/lo"
    await delay();
    expect(lastFrame()).toContain("/logout");
    // Non-matching commands drop out of the palette (/lang isn't shown anywhere else).
    expect(lastFrame()).not.toContain("/lang");
  });

  it("completes an argument-command without corrupting the cursor (B4 regression)", async () => {
    const delay = () => new Promise((r) => setTimeout(r, 25));
    const open42 = new Open42({ provider: fakeProvider });
    const { stdin, lastFrame } = render(<Chat open42={open42} demo initialLang="en" />);

    stdin.write("/lang");
    await delay();
    stdin.write("\r"); // Enter: /lang needs an argument → completes to "/lang "
    await delay();
    stdin.write("fr"); // typing the argument must land after the space
    await delay();

    expect(lastFrame()).toContain("/lang fr");
    expect(lastFrame()).not.toContain("/langfr");
  });
});
