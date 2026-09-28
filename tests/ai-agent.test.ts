import test from "node:test";
import assert from "node:assert/strict";
import {
  detectAgentIntent,
  buildExecutionPlan,
  agentToolRegistry,
  executePlanStep,
  type AgentExecutionContext,
} from "../src/lib/ai/agent-engine.ts";

test("Agent Intent: accurately classifies task creation and todo requests", () => {
  const intent1 = detectAgentIntent("Create task to review code");
  const intent2 = detectAgentIntent("Add task for quarterly planning");
  assert.equal(intent1, "TASK");
  assert.equal(intent2, "TASK");
});

test("Agent Intent: classifies research inquiries", () => {
  const intent = detectAgentIntent("Research deep learning architectures and investigate sources");
  assert.equal(intent, "RESEARCH");
});

test("Agent Intent: classifies coding requests", () => {
  const intent = detectAgentIntent("Debug this typescript react function bug");
  assert.equal(intent, "CODING");
});

test("Agent Intent: classifies memory requests", () => {
  const intent = detectAgentIntent("Remember that my favorite language is Rust");
  assert.equal(intent, "MEMORY_REQUEST");
});

test("Agent Intent: classifies planning requests", () => {
  const intent = detectAgentIntent("Build a strategic roadmap for next release");
  assert.equal(intent, "PLANNING");
});

test("Agent Intent: defaults to conversation for general chat", () => {
  const intent = detectAgentIntent("Hello NOVA, tell me a quick thought for the day");
  assert.equal(intent, "CONVERSATION");
});

test("Agent Planner: creates plan steps with proper dependencies", () => {
  const plan = buildExecutionPlan("Create task for code audit", "TASK");
  assert.equal(plan.intent, "TASK");
  assert.ok(plan.steps.length > 0);
  assert.equal(plan.steps[0]?.toolName, "list_tasks");
});

test("Agent Tool Security: privileged delete requires explicit user confirmation", async () => {
  const contextWithoutConfirm: AgentExecutionContext = {
    userId: "test-user-1",
    plan: "pro",
    userConfirmedPrivileged: false,
  };

  const deleteTool = agentToolRegistry.get("delete_memory");
  assert.ok(deleteTool);
  assert.equal(deleteTool.safetyLevel, "DELETE");
  assert.equal(deleteTool.requiresConfirmation, true);

  const res = await deleteTool.execute({ id: "mem-1" }, contextWithoutConfirm);
  assert.equal(res.success, false);
  assert.match(res.error || "", /authorization required/i);
});

test("Agent Step Execution: handles non-existent tools safely", async () => {
  const context: AgentExecutionContext = {
    userId: "test-user-1",
    plan: "free",
  };

  const step = await executePlanStep(
    {
      id: "step-invalid",
      goal: "Execute mystery tool",
      toolName: "non_existent_tool_xyz",
      dependsOn: [],
      status: "pending",
    },
    context,
  );

  assert.equal(step.status, "failed");
  assert.match(step.error || "", /not registered/i);
});
