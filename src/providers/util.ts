/** Default per-request timeout (ms) so a dead endpoint can't hang the CLI forever. */
export const REQUEST_TIMEOUT_MS = 120_000;

// Prefixes of the API keys Open42 accepts (see HOSTED_PRESETS[].keyPrefix):
// sk- (OpenAI, Anthropic sk-ant-, OpenRouter sk-or-v1-), nvapi- (NVIDIA), gsk_ (Groq).
// Kept here (a low-level module) to avoid a providers→cli dependency; a test in
// util.test.ts asserts this stays in sync with HOSTED_PRESETS.
const KEY_PATTERN = /(sk-|nvapi-|gsk_)[A-Za-z0-9_-]{6,}/g;

/** Mask anything that looks like an API key, keeping the prefix for context. */
export function redactKeys(text: string): string {
  return text.replace(KEY_PATTERN, (_match, prefix: string) => `${prefix}***`);
}

/**
 * Read a non-OK response body for an error message, truncated and with anything
 * that looks like an API key redacted (error bodies can echo the sent key).
 */
export async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return redactKeys(text.slice(0, 500));
  } catch {
    return "<no body>";
  }
}

/**
 * A short, human-readable cause for a failed `fetch`. Node surfaces the real
 * reason (e.g. "ECONNREFUSED") on the error's `cause`, so prefer that over the
 * generic "fetch failed" message.
 */
export function networkErrorDetail(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && "code" in cause) {
      const code = (cause as { code?: unknown }).code;
      if (typeof code === "string") return code;
    }
    return err.message;
  }
  return String(err);
}
