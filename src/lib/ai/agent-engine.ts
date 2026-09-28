/**
 * NOVA Autonomous AI Agent Engine
 *
 * Implements:
 * - Intent detection across conversational, research, task, coding, planning, etc.
 * - Multi-step planning with subtask dependency trees
 * - Typed tool registration with safety classifications (READ, WRITE, DELETE, EXTERNAL, PRIVILEGED)
 * - Safe tool execution boundaries with error recovery & retry logic
 * - Memory & Knowledge retrieval hooks
 */

import { supabase } from "../supabase.ts";
import type { PlanTier } from "../../types/index.ts";

export type AgentIntent =
  | "QUESTION"
  | "COMMAND"
  | "TASK"
  | "RESEARCH"
  | "CODING"
  | "ANALYSIS"
  | "PLANNING"
  | "FILE_OPERATION"
  | "PROJECT_OPERATION"
  | "MEMORY_REQUEST"
  | "AUTOMATION"
  | "SYSTEM_REQUEST"
  | "CONVERSATION";

export type ToolSafetyLevel = "READ" | "WRITE" | "DELETE" | "EXTERNAL" | "PRIVILEGED";

export interface AgentToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  safetyLevel: ToolSafetyLevel;
  requiresConfirmation?: boolean;
  execute: (input: TInput, context: AgentExecutionContext) => Promise<ToolExecutionResult<TOutput>>;
}

export interface ToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isRecoverable?: boolean;
}

export interface AgentExecutionContext {
  userId: string;
  plan: PlanTier;
  conversationId?: string;
  userConfirmedPrivileged?: boolean;
}

export interface ExecutionPlanStep {
  id: string;
  goal: string;
  toolName?: string;
  input?: any;
  dependsOn: string[];
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  result?: any;
  error?: string;
}

export interface AgentExecutionPlan {
  id: string;
  userGoal: string;
  intent: AgentIntent;
  steps: ExecutionPlanStep[];
  status: "planning" | "executing" | "completed" | "failed";
}

/**
 * 1. Intent Detection
 */
export function detectAgentIntent(input: string): AgentIntent {
  const text = input.toLowerCase().trim();

  if (text.match(/\b(create task|todo|add task|mark done|finish task|task status)\b/)) {
    return "TASK";
  }
  if (text.match(/\b(remember|forget|memory|recall|preferences|store note)\b/)) {
    return "MEMORY_REQUEST";
  }
  if (text.match(/\b(plan|roadmap|strategy|breakdown|milestone|schedule|steps)\b/)) {
    return "PLANNING";
  }
  if (text.match(/\b(research|deep dive|literature|investigate|explore sources|study)\b/)) {
    return "RESEARCH";
  }
  if (text.match(/\b(code|function|component|bug|debug|refactor|sql|typescript|react)\b/)) {
    return "CODING";
  }
  if (text.match(/\b(analyze|metrics|stats|dataset|trends|chart|evaluation)\b/)) {
    return "ANALYSIS";
  }
  if (text.match(/\b(upload|download|read file|delete file|attachment|document)\b/)) {
    return "FILE_OPERATION";
  }
  if (text.match(/\b(project|workspace|create project|archive project)\b/)) {
    return "PROJECT_OPERATION";
  }
  if (text.match(/\b(automate|cron|trigger|workflow|rule|integration)\b/)) {
    return "AUTOMATION";
  }
  if (text.match(/\b(system|status|health|version|diagnostic|security check)\b/)) {
    return "SYSTEM_REQUEST";
  }
  if (text.endsWith("?") || text.match(/\b(what|why|how|when|where|who|is there|can you)\b/)) {
    return "QUESTION";
  }
  if (text.match(/\b(execute|run|trigger|set|update|change|delete|remove)\b/)) {
    return "COMMAND";
  }

  return "CONVERSATION";
}

/**
 * 2. Tool Registry
 */
class ToolRegistry {
  private tools = new Map<string, AgentToolDefinition>();

  register(tool: AgentToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): AgentToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const agentToolRegistry = new ToolRegistry();

// Tool: Query Tasks
agentToolRegistry.register({
  name: "list_tasks",
  description: "List user tasks filtered by optional status",
  safetyLevel: "READ",
  execute: async (input: { status?: string }, context) => {
    let query = supabase.from("tasks").select("*").eq("user_id", context.userId);
    if (input.status) {
      query = query.eq("status", input.status);
    }
    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data: data ?? [] };
  },
});

// Tool: Create Task
agentToolRegistry.register({
  name: "create_task",
  description: "Create a new task with title and priority",
  safetyLevel: "WRITE",
  execute: async (input: { title: string; priority?: string; description?: string }, context) => {
    if (!input.title?.trim()) {
      return { success: false, error: "Task title is required", isRecoverable: false };
    }
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: context.userId,
        title: input.title.trim(),
        priority: input.priority || "medium",
        status: "todo",
      })
      .select("*")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data };
  },
});

// Tool: Read Memories
agentToolRegistry.register({
  name: "read_memories",
  description: "Retrieve user personal preferences and saved memories",
  safetyLevel: "READ",
  execute: async (_input, context) => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", context.userId)
      .eq("archived", false)
      .limit(15);

    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data: data ?? [] };
  },
});

// Tool: Save Memory
agentToolRegistry.register({
  name: "save_memory",
  description: "Save an important user preference or fact to long-term memory",
  safetyLevel: "WRITE",
  execute: async (input: { content: string; category?: string }, context) => {
    if (!input.content?.trim()) {
      return { success: false, error: "Memory content cannot be empty", isRecoverable: false };
    }
    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: context.userId,
        content: input.content.trim(),
        category: input.category || "personal",
        archived: false,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data };
  },
});

// Tool: Delete Memory (Privileged / high risk)
agentToolRegistry.register({
  name: "delete_memory",
  description: "Delete a saved memory item",
  safetyLevel: "DELETE",
  requiresConfirmation: true,
  execute: async (input: { id: string }, context) => {
    if (!context.userConfirmedPrivileged) {
      return {
        success: false,
        error: "Explicit user authorization required for memory deletion.",
        isRecoverable: false,
      };
    }
    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", input.id)
      .eq("user_id", context.userId);

    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data: { deletedId: input.id } };
  },
});

// Tool: List Projects
agentToolRegistry.register({
  name: "list_projects",
  description: "List user projects and workspaces",
  safetyLevel: "READ",
  execute: async (_input, context) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", context.userId);

    if (error) {
      return { success: false, error: error.message, isRecoverable: true };
    }
    return { success: true, data: data ?? [] };
  },
});

/**
 * 3. Autonomous Multi-Step Planner
 */
export function buildExecutionPlan(goal: string, intent: AgentIntent): AgentExecutionPlan {
  const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const steps: ExecutionPlanStep[] = [];

  switch (intent) {
    case "TASK":
      steps.push({
        id: "step-1",
        goal: "Query current task state to avoid duplicates",
        toolName: "list_tasks",
        input: {},
        dependsOn: [],
        status: "pending",
      });
      break;

    case "MEMORY_REQUEST":
      steps.push({
        id: "step-1",
        goal: "Retrieve relevant memory context",
        toolName: "read_memories",
        input: {},
        dependsOn: [],
        status: "pending",
      });
      break;

    case "PLANNING":
    case "PROJECT_OPERATION":
      steps.push({
        id: "step-1",
        goal: "Inspect user projects to anchor context",
        toolName: "list_projects",
        input: {},
        dependsOn: [],
        status: "pending",
      });
      break;

    default:
      // Direct conversational reasoning without tool dependencies
      break;
  }

  return {
    id: planId,
    userGoal: goal,
    intent,
    steps,
    status: steps.length > 0 ? "planning" : "completed",
  };
}

/**
 * 4. Plan Executor with Bounded Retries & Error Boundaries
 */
export async function executePlanStep(
  step: ExecutionPlanStep,
  context: AgentExecutionContext,
  maxRetries = 2,
): Promise<ExecutionPlanStep> {
  if (!step.toolName) {
    return { ...step, status: "completed" };
  }

  const tool = agentToolRegistry.get(step.toolName);
  if (!tool) {
    return {
      ...step,
      status: "failed",
      error: `Tool "${step.toolName}" is not registered in the agent engine.`,
    };
  }

  step.status = "in_progress";
  let attempts = 0;
  let lastError = "";

  while (attempts <= maxRetries) {
    attempts++;
    try {
      const res = await tool.execute(step.input, context);
      if (res.success) {
        return {
          ...step,
          status: "completed",
          result: res.data,
          error: undefined,
        };
      }

      lastError = res.error || "Execution failed";
      if (!res.isRecoverable) {
        break; // Stop retrying non-recoverable error
      }
    } catch (err: any) {
      lastError = err?.message || "Unexpected tool execution failure";
    }
  }

  return {
    ...step,
    status: "failed",
    error: lastError,
  };
}
