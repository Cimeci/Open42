// Minimal Server-Sent Events reader for streaming completions.

/**
 * Read an SSE response line by line, invoking `onData` with the payload of each
 * `data:` line. Works with the web ReadableStream returned by Node's fetch.
 */
export async function readSSE(
  response: Response,
  onData: (data: string) => void,
): Promise<void> {
  const body = response.body;
  if (!body) throw new Error("Streaming response has no body.");

  const decoder = new TextDecoder();
  let buffer = "";

  // Node's fetch body is an async iterable of Uint8Array chunks.
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line.startsWith("data:")) {
        const data = line.slice("data:".length).trim();
        if (data) onData(data);
      }
    }
  }
}
