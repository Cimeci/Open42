const KEY_PATTERN = /(sk-[A-Za-z0-9_-]{6,})/g;

/**
 * Read a non-OK response body for an error message, truncated and with anything
 * that looks like an API key redacted (error bodies can echo the sent key).
 */
export async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500).replace(KEY_PATTERN, "sk-***");
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
