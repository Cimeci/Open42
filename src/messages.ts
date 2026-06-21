// Shared helpers for turning a tutoring transcript into provider messages.

import type { Message, ProviderMessage } from "./types.js";

/** Validate that a transcript is non-empty and ends on a student turn. */
export function assertRespondable(transcript: readonly Message[]): void {
  if (transcript.length === 0) {
    throw new Error("Transcript is empty.");
  }
  if (transcript[transcript.length - 1]!.role !== "student") {
    throw new Error("The transcript must end with a student message.");
  }
}

/** The harness speaks in student/mentor; providers speak in user/assistant. */
export function toProviderMessages(transcript: readonly Message[]): ProviderMessage[] {
  return transcript.map((m) => ({
    role: m.role === "student" ? "user" : "assistant",
    content: m.content,
  }));
}
