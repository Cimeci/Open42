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

  const emit = (line: string) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) {
      const data = trimmed.slice("data:".length).trim();
      if (data) onData(data);
    }
  };

  const decoder = new TextDecoder();
  let buffer = "";

  // Node's fetch body is an async iterable of Uint8Array chunks.
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      emit(buffer.slice(0, newlineIndex));
      buffer = buffer.slice(newlineIndex + 1);
    }
  }

  buffer += decoder.decode(); // flush any trailing multi-byte character
  if (buffer) emit(buffer);
}
