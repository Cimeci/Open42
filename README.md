# Open42

> An [Agent Skill](https://agentskills.io) that turns your AI coding assistant into
> a **Socratic mentor**: it helps you learn to code, reason, architect, review,
> **and use AI well, without becoming dependent on it.**

Works with any tool that supports Agent Skills: Claude Code, Codex, OpenCode,
Cursor, Gemini CLI...

## Install

The quickest way, for any supported tool:

```bash
npx skills add Cimeci2/Open42
```

Or by hand, copy the `skills/open42/` folder into your tool's skills directory.
For Claude Code:

```bash
git clone https://github.com/Cimeci2/Open42.git
cp -r Open42/skills/open42 ~/.claude/skills/        # every project
# or: cp -r Open42/skills/open42 .claude/skills/    # this project only
```

OpenCode can also point at the folder with `skills.paths` in its config.

Then turn it on for your project by adding this line to its `AGENTS.md` (Codex,
OpenCode, Cursor...) and/or `CLAUDE.md` (Claude Code):

```markdown
I am learning. Always use the open42 skill.
```

This is the recommended setup. Without it, the assistant decides on its own when
the skill applies (e.g. when you say "I'm a student, help me understand this
bug"), which is less reliable, especially under pressure like "just give me the
code, my deadline is in 10 minutes".

## Why

LLMs make it trivial to get working code in seconds. For a learner that is a
trap: copy-paste a generated solution and you ship working code and learn nothing.
Worse, you build a *dependence* on the tool instead of the skill to command it.

Open42 has two goals at once:

1. **Learn to think**: debug, reason, design, and review *yourself*.
2. **Learn to wield AI**: go faster and further *with* AI while staying able to
   work *without* it.

> Dependence is using AI to **avoid** thinking. Mastery is using AI to
> **amplify** thinking.

It follows the spirit of [42](https://42.fr)'s pedagogy (autonomy, peer-learning,
learning by doing) and the method of *maïeutics*: the Socratic art of helping
someone give birth to knowledge they already carry.

## What's inside

One mentor, several lenses, picked from what the student needs:

| Lens | Helps the student... |
|---|---|
| **Debugging** | find bugs methodically: reproduce, observe, hypothesise, bisect. |
| **Reasoning** | get unstuck: restate, solve by hand, decompose, simplify. |
| **Architecture** | weigh design choices and own the trade-offs. |
| **Review** | critique their *own* code instead of being handed fixes. |
| **AI literacy** | decompose, prompt, **verify**, and judge when *not* to use AI. |
| **Peer learning** | break a loop with a focused question for a classmate. |
| **42 context** | stay within the project brief, norms and evaluation rules. |

Plus a **verify** mode (reasoning made checkable, a command to prove it, sources),
**rigor levels** (`graduated`, `strict`, `adaptive`), and optional **learner
notes** in `.open42/learner-notes.md` for continuity across sessions.

### The guardrails

1. **Lead with understanding, not answers.** Never a copy-pasteable solution.
2. **One good question beats ten hints.**
3. **You must understand what you ship.** Output never outruns understanding.
4. **Verify everything.** AI (including the mentor) is sometimes confidently wrong.
5. **Protect the productive struggle**, and hold the line warmly when begged.
6. **Hands off the student's code**: in an agent, it reads your files but never
   edits your solution.

A skill is instructions, not a sandbox: a determined student can switch it off.
Open42 is built for people who *want* to learn.

## Layout

```
skills/open42/
├── SKILL.md                  # the core: persona, prime directive, Socratic loop, guardrails
└── references/               # loaded on demand
    ├── calibration.md        #   reading the level, scaffolding ladder
    ├── independence.md       #   using AI without depending on it
    ├── verify.md             #   verify mode
    ├── learner-notes.md      #   cross-session memory
    └── mentors/              #   debugging · reasoning · architecture · review · ai-literacy · peer-learning · 42-context
evals/scenarios.md            # behavioural checks to run after any change
```

## Contributing

Better questions, new lenses, translations and failure reports are all welcome.
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE): free to use, fork, and adapt, including by schools.
