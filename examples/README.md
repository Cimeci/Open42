# Examples

## The terminal app

The real product is the Open42 terminal app. From the repo root:

```bash
npm install
npm start        # builds, then launches the Ink TUI
```

It onboards your API key on first run (or reads `ANTHROPIC_API_KEY` /
`OPENAI_API_KEY`). See the root README for in-app commands.

## Offline previews (no API key needed)

```bash
npm run build

node examples/inspect.mjs       # mentors, automatic routing, guardrail checks
node examples/tui-preview.mjs   # a rendered snapshot of the TUI
```

## Library / minimal CLI (`cli.ts`)

A tiny readline chat showing the library API directly (no Ink):

```bash
export ANTHROPIC_API_KEY=sk-...
npm run example
```

Swap `AnthropicProvider` for `OpenAIProvider` (or any compatible endpoint, e.g.
Ollama via `baseUrl`) to try a different model.
