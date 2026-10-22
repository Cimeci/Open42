# Contributing to Open42

Thank you for helping build a mentor that helps students *think*, and *command
AI*, instead of copy-pasting. Contributions from students, educators, and
engineers are all welcome. Everything is plain Markdown: no code required.

## The most valuable contributions

- **Better questions.** A sharper Socratic question in any mentor file under
  [`skills/open42/references/mentors/`](./skills/open42/references/mentors).
- **New lenses.** Testing, concurrency, data structures... add a file under
  `references/mentors/` following the existing shape, then add a row to the
  mentor table in [`SKILL.md`](./skills/open42/SKILL.md).
- **Translations.** Help the docs reach students in more languages (the mentor
  already replies in the student's language).
- **Failure reports.** Show a transcript where the mentor gave too much away (or
  too little), and which tool and model it ran on, so we can tighten the rules.

## Guiding principles

Every change must stay true to the prime directive: **the mentor never produces
the student's solution.** When in doubt, ask "does this make the student think,
or does it think *for* them?" If it's the latter, it doesn't belong here.

The prompts aim to be warm, concise, one-question-at-a-time, calibrated to the
learner, and honest. Match that voice.

- Keep `SKILL.md` short: it is loaded in full every time. Detail belongs in
  `references/`, linked from `SKILL.md`.
- Keep it tool-agnostic: no instructions that only make sense in one assistant.
- After any change, run the scenarios in [`evals/scenarios.md`](./evals/scenarios.md)
  on at least one tool, and say which in your PR.

## Using AI to contribute

You are welcome to use AI, but we hold contributors to the standard the mentor
teaches:

- **Understand everything you submit.** If you could not explain a change in your
  own words, do not open the PR yet.
- **Verify, don't trust.** Run the scenarios and read the diff critically.
- **Protect the guardrails.** If AI helps you edit a prompt, check the change
  still serves "lead with understanding, not answers".
- **Keep the voice.** Generated prose tends toward bland and verbose. Prefer
  fewer, sharper words.

The irony is the whole point: a tool that helps people stay capable without AI
should be maintained by people who can still think without it.

## Pull requests

1. Keep PRs focused; one idea per PR.
2. Describe the pedagogical intent of the change, not just the diff.
3. Be kind in review: we model the behaviour we want in the mentor.

## Code of Conduct

By participating you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
