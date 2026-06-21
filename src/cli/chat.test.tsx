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

  it("starts onboarding by asking which provider to use (en)", () => {
    const { lastFrame } = render(<Onboarding onDone={() => {}} initialLang="en" />);
    expect(lastFrame()).toContain("What do you want to use?");
    expect(lastFrame()).toContain("Local (Ollama)");
  });

  it("renders a localized chat input prompt", () => {
    const open42 = new Open42({ provider: fakeProvider });
    const fr = render(<Chat open42={open42} initialLang="fr" />);
    expect(fr.lastFrame()).toContain("Pose ta question…");
    const en = render(<Chat open42={open42} initialLang="en" />);
    expect(en.lastFrame()).toContain("Ask your question…");
  });
});
