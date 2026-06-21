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
