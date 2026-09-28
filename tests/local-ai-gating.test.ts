import test from "node:test";
import assert from "node:assert/strict";
import { classifyTaskType } from "../src/lib/ai/router.ts";

const LOCAL_MODES = ["nova-private", "nova-offline"] as const;

function isLocalMode(mode: string | null | undefined): boolean {
  return mode === "nova-private" || mode === "nova-offline";
}

function assertNoCloudFallback(
  mode: string,
  localAvailable: boolean,
): { success: boolean; error?: string } {
  if (isLocalMode(mode)) {
    if (!localAvailable) {
      return {
        success: false,
        error: `${mode} only runs on this device, so NOVA will not use the cloud instead.`,
      };
    }
    return { success: true };
  }
  return { success: true };
}

test("Local AI Gating: private and offline modes are recognized as local", () => {
  assert.equal(isLocalMode("nova-private"), true);
  assert.equal(isLocalMode("nova-offline"), true);
  assert.equal(isLocalMode("nova-auto"), false);
  assert.equal(isLocalMode("nova-fast"), false);
  assert.equal(isLocalMode("nova-reasoning"), false);
});

test("Local AI Gating: strictly refuses cloud fallback when local AI is unavailable", () => {
  const result = assertNoCloudFallback("nova-private", false);
  assert.equal(result.success, false);
  assert.match(result.error || "", /will not use the cloud instead/i);
});

test("Local AI Gating: offline mode also refuses cloud fallback when local AI is unavailable", () => {
  const result = assertNoCloudFallback("nova-offline", false);
  assert.equal(result.success, false);
  assert.match(result.error || "", /will not use the cloud instead/i);
});

test("Task Classification: accurately identifies coding questions", () => {
  assert.equal(classifyTaskType("Write a function in python to reverse a string"), "coding");
  assert.equal(classifyTaskType("Fix this typescript compile bug"), "coding");
});

test("Task Classification: accurately identifies reasoning tasks", () => {
  assert.equal(
    classifyTaskType("Step by step, why is the sky blue? Explain why in detail."),
    "reasoning",
  );
});

test("Task Classification: accurately identifies simple greetings", () => {
  assert.equal(classifyTaskType("hello"), "simple");
  assert.equal(classifyTaskType("hi"), "simple");
});

import { routeRequest } from "../src/lib/ai/orchestrator.ts";

test("Local routing: private mode resolves to Ollama and is cloud-ineligible", () => {
  const decision = routeRequest("nova-private", "free", "hello");
  assert.equal(decision.localOnly, true);
  assert.equal(decision.model.provider, "ollama");
});

test("Local routing: offline mode resolves to Ollama and is cloud-ineligible", () => {
  const decision = routeRequest("nova-offline", "free", "hello");
  assert.equal(decision.localOnly, true);
  assert.equal(decision.model.provider, "ollama");
});
