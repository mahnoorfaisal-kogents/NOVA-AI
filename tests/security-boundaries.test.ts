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
