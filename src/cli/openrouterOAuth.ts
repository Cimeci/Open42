// OpenRouter OAuth PKCE - lets the user connect "via the web" like Claude Code:
// open the browser, click authorize, and the API key comes back automatically to
// a short-lived localhost callback server. Docs: https://openrouter.ai/docs (OAuth PKCE).

import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";

const AUTH_URL = "https://openrouter.ai/auth";
const EXCHANGE_URL = "https://openrouter.ai/api/v1/auth/keys";
const DEFAULT_TIMEOUT_MS = 180_000;

export interface PkcePair {
  readonly verifier: string;
  readonly challenge: string;
}

/** A PKCE verifier (kept local) and its S256 challenge (sent in the auth URL). */
export function generatePkce(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** The authorization URL to open in the browser. */
export function buildAuthUrl(callbackUrl: string, challenge: string): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set("callback_url", callbackUrl);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** Exchange the authorization code for a user-controlled OpenRouter API key. */
export async function exchangeCodeForKey(
  code: string,
  verifier: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const doFetch = options.fetchImpl ?? fetch;
  const response = await doFetch(EXCHANGE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter OAuth: exchange failed (HTTP ${response.status}).`);
  }
  const data = (await response.json()) as { key?: unknown };
  if (typeof data.key !== "string" || !data.key) {
    throw new Error("OpenRouter OAuth: no API key in the response.");
  }
  return data.key;
}

const DONE_PAGE =
  "<!doctype html><meta charset=utf-8><title>Open42</title>" +
  "<body style=\"font-family:system-ui;text-align:center;padding-top:4rem\">" +
  "<h2>Open42 connected ✓</h2><p>You can close this tab and return to your terminal.</p>";

export interface AuthorizeOptions {
  /** Opens the given URL in the user's browser. */
  readonly openBrowser: (url: string) => void;
  /** Called with the auth URL so the caller can display it as a fallback. */
  readonly onUrl?: (url: string) => void;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

/**
 * Run the full flow: start a localhost callback server, open the browser to the
 * auth URL, wait for the redirect carrying the code, exchange it, and resolve to
 * the API key. The server is always torn down (success, error, timeout, abort).
 */
export function authorizeWithOpenRouter(options: AuthorizeOptions): Promise<string> {
  const { verifier, challenge } = generatePkce();

  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      const code = requestUrl.searchParams.get("code");
      if (!code) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("Missing authorization code.");
        return;
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(DONE_PAGE);
      exchangeCodeForKey(code, verifier)
        .then((key) => finish(null, key))
        .catch((err) => finish(err instanceof Error ? err : new Error(String(err))));
    });

    let settled = false;
    const finish = (err: Error | null, key?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      server.close();
      if (err) reject(err);
      else resolve(key!);
    };
    const onAbort = () => finish(new Error("OpenRouter OAuth: cancelled."));
    const timer = setTimeout(
      () => finish(new Error("OpenRouter OAuth: timed out waiting for authorization.")),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    options.signal?.addEventListener("abort", onAbort);
    server.on("error", (err) => finish(err));
    // Ephemeral port on loopback only.
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const authUrl = buildAuthUrl(`http://localhost:${port}`, challenge);
      options.onUrl?.(authUrl);
      options.openBrowser(authUrl);
    });
  });
}
