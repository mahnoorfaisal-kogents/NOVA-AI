import test from "node:test";
import assert from "node:assert/strict";
import { isLoopbackOllamaUrl } from "../src/lib/ai/local-runtime.ts";

test("Ollama boundary: accepts localhost on the default port", () => {
  assert.equal(isLoopbackOllamaUrl("http://localhost:11434"), true);
});

test("Ollama boundary: accepts IPv4 loopback with a custom local port", () => {
  assert.equal(isLoopbackOllamaUrl("http://127.0.0.1:11435"), true);
});

test("Ollama boundary: accepts IPv6 loopback", () => {
  assert.equal(isLoopbackOllamaUrl("http://[::1]:11434"), true);
});

test("Ollama boundary: rejects non-loopback hosts", () => {
  assert.equal(isLoopbackOllamaUrl("http://192.168.1.20:11434"), false);
  assert.equal(isLoopbackOllamaUrl("https://example.com"), false);
});

test("Ollama boundary: rejects credentials embedded in the endpoint", () => {
  assert.equal(isLoopbackOllamaUrl("http://user:pass@localhost:11434"), false);
});

test("Ollama boundary: rejects unsupported protocols", () => {
  assert.equal(isLoopbackOllamaUrl("ftp://localhost:11434"), false);
});

import { readFileSync } from "node:fs";

test("Server security: production auth middleware does not mint a demo identity", () => {
  const source = readFileSync("src/integrations/supabase/auth-middleware.ts", "utf8");
  assert.doesNotMatch(source, /demo-user-nova/);
  assert.match(source, /Server authentication is not configured/);
});

test("Server security: admin client fails closed instead of returning a fake client", () => {
  const source = readFileSync("src/integrations/supabase/client.server.ts", "utf8");
  assert.doesNotMatch(source, /mock admin client/i);
  assert.match(source, /Server Supabase admin client is not configured/);
});

test("Cloud boundary: Gemini SDK and API key fallback are absent", () => {
  const source = readFileSync("src/lib/ai/hybrid.functions.ts", "utf8");
  assert.doesNotMatch(source, /GoogleGenAI|GEMINI_API_KEY/);
});

test("Production browser boundary: mock Supabase client is development-gated", () => {
  const source = readFileSync("src/integrations/supabase/client.ts", "utf8");
  assert.match(source, /import\.meta\.env\.DEV/);
  assert.match(source, /production build/);
});
