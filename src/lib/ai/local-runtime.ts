export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLoopbackOllamaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeOllamaUrl(value: string | null | undefined): string {
  if (!value || !isLoopbackOllamaUrl(value)) return DEFAULT_OLLAMA_URL;
  return value.replace(/\/$/, "");
}
