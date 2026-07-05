import { spawn } from "node:child_process";

/**
 * Open a URL in the user's default browser. Best-effort: failures (headless
 * shells, missing opener) are swallowed, so the caller should also print the URL
 * for manual copy. The URL comes from a fixed preset table, never user input.
 */
export function openBrowser(url: string): void {
  try {
    const [command, args] =
      process.platform === "darwin"
        ? (["open", [url]] as const)
        : process.platform === "win32"
          ? (["cmd", ["/c", "start", "", url]] as const)
          : (["xdg-open", [url]] as const);
    const child = spawn(command, [...args], { stdio: "ignore", detached: true });
    child.on("error", () => {
      // Opener not available - the caller still shows the URL to copy manually.
    });
    child.unref();
  } catch {
    // Best-effort only.
  }
}
