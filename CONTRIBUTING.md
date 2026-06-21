# Contributing to Open42

Thank you for helping build mentors that help students *think* - and *command
AI* - instead of copy-pasting. Contributions from students, educators, and
engineers are all welcome.

## The most valuable contributions

The heart of this project is in [`prompts/`](./prompts) - plain Markdown, no code
required. The best contributions are usually pedagogical:

- **Better questions.** A sharper Socratic question in any domain file.
- **New domains.** Testing, concurrency, data structures… propose a new file
  under `prompts/domains/` following the existing shape, then wire a mentor to it
  in `src/mentors.ts`.
- **New mentors (sub-agents).** A specialised mentor in `src/mentors.ts`, or
  document how to register a custom one.
- **Translations.** Help the mentors and docs reach students in more languages.
- **Failure reports.** Show a transcript where a mentor gave too much away (or
  too little) so we can tighten the guardrails.

## Guiding principles (please read before proposing prompt changes)

Every change must stay true to the Prime Directive: **the mentor never produces
the student's solution.** When in doubt, ask "does this make the student think,
or does it think *for* them?" If it's the latter, it doesn't belong here.

The prompts aim to be: warm, concise, one-question-at-a-time, calibrated to the
learner, and honest. Match that voice.

## Working on the code

```bash
npm install
npm run build      # generates prompts + compiles TypeScript
npm test           # runs the vitest suite
npm run eval       # pedagogical evals; add OLLAMA_MODEL=... for free local behavioural evals
npm run demo       # try the terminal UI with no API key
```

When you change prompts or routing, run `npm run eval` - the structural evals
guard against accidentally weakening the guardrails or breaking mentor routing.

- The prompt module `src/generated/prompts.ts` is **generated** from `prompts/`.
  Never edit it by hand - edit the Markdown and re-run `npm run build`.
- Keep the harness **provider-agnostic**. Provider-specific logic belongs in
  `src/providers/`, behind the `Provider` interface.
- Add tests for new behaviour. Keep functions small and files focused.

## Using AI to contribute

Open42 is built with AI assistance, and you are welcome to use AI to contribute.
But we hold contributors to the same standard the tool teaches learners. The
point of this project is using AI to *amplify* thinking, not to *replace* it.

So, when you use AI on a contribution:

- **Understand everything you submit.** If you could not explain a change in your
  own words in review, do not open the PR yet. Unreviewed AI output is borrowed,
  not owned.
- **Verify, don't trust.** AI (including the model behind Open42) is confidently
  wrong sometimes. Run `npm run build`, `npm test`, and `npm run eval` before
  submitting, and read the diff critically rather than assuming it is correct.
- **Protect the guardrails.** If AI helps you edit a prompt, a mentor, or the
  router, ask whether the change still serves "lead with understanding, not
  answers". Run `npm run eval`; if you weaken a guardrail, the structural evals
  should catch it - and if they do not, that is itself a bug worth reporting.
- **Keep the voice.** Generated prose tends toward bland and verbose. Prefer
  fewer, sharper words; match the existing tone in the prompts and docs.
- **Be transparent.** If a contribution is largely AI-generated, a short note in
  the PR helps reviewers calibrate.

The irony is the whole point: a tool that helps people stay capable without AI
should be maintained by people who can still think without it.

## Pull requests

1. Keep PRs focused; one idea per PR.
2. Describe the pedagogical intent of prompt changes, not just the diff.
3. Make sure `npm run build` and `npm test` pass.
4. Be kind in review - we model the behaviour we want in the mentor.

## Code of Conduct

By participating you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
