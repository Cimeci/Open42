// Discover local LLM runtimes that expose an OpenAI-compatible HTTP API.
// Ollama, LM Studio, vLLM, llama.cpp (llama-server), Jan, HF TGI, LocalAI… all
// answer `GET {baseUrl}/models` (OpenAI shape). We probe a small table of known
// localhost endpoints and list whatever responds, so the user can pick any local
// model that is actually running, regardless of which tool serves it.

export interface LocalRuntime {
  /** Stable id, e.g. "ollama". */
  readonly id: string;
  /** Human-facing label shown in the picker. */
  readonly label: string;
  /** OpenAI-compatible API root, e.g. "http://localhost:11434/v1". */
  readonly baseUrl: string;
}

export interface DetectedModel {
  /** The runtime that served this model (its `LocalRuntime.id`). */
  readonly runtime: string;
  readonly label: string;
  /** Model id/name as advertised by the runtime. */
  readonly model: string;
  /** Chat-completions endpoint to hand to `OpenAIProvider` (`baseUrl` option). */
  readonly chatUrl: string;
}

type FetchImpl = typeof fetch;

interface ProbeOptions {
  readonly timeoutMs?: number;
  readonly fetchImpl?: FetchImpl;
}

const DEFAULT_TIMEOUT_MS = 400;

// Ports/URLs of the most common local inference servers. Several tools share
// :8080 (llama.cpp, LocalAI, HF TGI) so that entry carries a combined label.
const BUILTIN_RUNTIMES: readonly LocalRuntime[] = [
  { id: "ollama", label: "Ollama", baseUrl: "http://localhost:11434/v1" },
  { id: "lmstudio", label: "LM Studio", baseUrl: "http://localhost:1234/v1" },
  { id: "vllm", label: "vLLM", baseUrl: "http://localhost:8000/v1" },
  { id: "server-8080", label: "llama.cpp / LocalAI / TGI (:8080)", baseUrl: "http://localhost:8080/v1" },
  { id: "jan", label: "Jan", baseUrl: "http://localhost:1337/v1" },
  { id: "tgi-3000", label: "HF TGI (:3000)", baseUrl: "http://localhost:3000/v1" },
];

const stripTrailingSlashes = (url: string): string => url.replace(/\/+$/, "");

/** Extra endpoints from `OPEN42_LOCAL_ENDPOINTS` (comma-separated base URLs). */
function envRuntimes(): LocalRuntime[] {
  const raw = process.env.OPEN42_LOCAL_ENDPOINTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((baseUrl, index) => ({
      id: `env-${index + 1}`,
      label: `Local (${baseUrl})`,
      baseUrl: stripTrailingSlashes(baseUrl),
    }));
}

/** Keep the first runtime per base URL (trailing slashes ignored). */
export function dedupeByBaseUrl(runtimes: readonly LocalRuntime[]): LocalRuntime[] {
  const seen = new Set<string>();
  const out: LocalRuntime[] = [];
  for (const runtime of runtimes) {
    const key = stripTrailingSlashes(runtime.baseUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(runtime);
  }
  return out;
}

/** The endpoints probed by default: user-provided ones first, then built-ins. */
export const KNOWN_LOCAL_RUNTIMES: readonly LocalRuntime[] = dedupeByBaseUrl([
  ...envRuntimes(),
  ...BUILTIN_RUNTIMES,
]);

/**
 * Extract model ids from a `/v1/models` (OpenAI: `{ data: [{ id }] }`) or an
 * Ollama `/api/tags` (`{ models: [{ name }] }`) payload. Pure and defensive.
 */
export function parseModelIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as { data?: unknown; models?: unknown };
  const list = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.models)
      ? record.models
      : [];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const entry = item as { id?: unknown; name?: unknown };
      if (typeof entry.id === "string") return entry.id;
      if (typeof entry.name === "string") return entry.name;
      return undefined;
    })
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

async function getJson(url: string, timeoutMs: number, doFetch: FetchImpl): Promise<unknown> {
  const response = await doFetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** List the models advertised at an OpenAI-compatible base URL. Throws if unreachable. */
export async function listModelsAt(baseUrl: string, options: ProbeOptions = {}): Promise<string[]> {
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const root = stripTrailingSlashes(baseUrl);
  const payload = await getJson(`${root}/models`, timeoutMs, doFetch);
  return parseModelIds(payload);
}

/**
 * Probe every known local runtime in parallel and return the models each one
 * serves. Never rejects: unreachable runtimes are simply skipped.
 */
export async function detectLocalModels(
  options: ProbeOptions & { runtimes?: readonly LocalRuntime[] } = {},
): Promise<DetectedModel[]> {
  const runtimes = dedupeByBaseUrl(options.runtimes ?? KNOWN_LOCAL_RUNTIMES);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;

  const perRuntime = await Promise.all(
    runtimes.map(async (runtime): Promise<DetectedModel[]> => {
      try {
        const models = await listModelsAt(runtime.baseUrl, { timeoutMs, fetchImpl });
        const root = stripTrailingSlashes(runtime.baseUrl);
        return models.map((model) => ({
          runtime: runtime.id,
          label: runtime.label,
          model,
          chatUrl: `${root}/chat/completions`,
        }));
      } catch {
        return [];
      }
    }),
  );

  return perRuntime.flat();
}
