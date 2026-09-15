/**
 * NOVA AI Orchestrator + model router.
 *
 * Single entry point for every AI answer in NOVA. It decides which runtime
 * answers a message based on the mode the user picked, and enforces the
 * local-only rule: Private and Offline modes are answered on the user's own
 * machine and are NEVER sent to a cloud service, not even as a fallback.
 *
 * Users only ever see modes (Auto, Fast, Reasoning, Coding, Research,
 * Private/Local, Offline/Local) — no providers, no API keys.
 */
import type { ModelInfo, PlanTier } from '@/types';
import { getModelById, getModelsForPlan, isLocalModel } from '@/lib/models';
import { classifyTaskType, routeModel, type TaskType } from '@/lib/ai/router';
import {
  checkLocalAI,
  getOllamaSettings,
  getProvider,
  type AIResponse,
  type ChatMessage,
  type ChatOptions,
} from '@/lib/ai/providers';

export const NOVA_MODES = [
  'nova-auto',
  'nova-fast',
  'nova-reasoning',
  'nova-coding',
  'nova-research',
  'nova-private',
  'nova-offline',
] as const;

export type NovaMode = (typeof NOVA_MODES)[number];

export const LOCAL_MODES: NovaMode[] = ['nova-private', 'nova-offline'];

export function isLocalMode(mode: string | null | undefined): boolean {
  return mode === 'nova-private' || mode === 'nova-offline';
}

export interface RouteDecision {
  model: ModelInfo;
  /** true when the answer must be generated on this device only. */
  localOnly: boolean;
  reason: string;
}

/**
 * Chooses the runtime for a message. An explicitly picked mode always wins;
 * Auto classifies the message and picks a cloud mode for it.
 */
export function routeRequest(
  mode: string | null,
  plan: PlanTier,
  text: string,
  contextSize?: number,
): RouteDecision {
  const available = getModelsForPlan(plan);

  if (mode && isLocalMode(mode)) {
    const local = getModelById(mode) ?? available.find(isLocalModel);
    if (local) {
      return {
        model: local,
        localOnly: true,
        reason: 'You chose a mode that only runs on this device.',
      };
    }
  }

  if (mode && mode !== 'nova-auto') {
    const picked = available.find((m) => m.id === mode);
    if (picked) {
      return {
        model: picked,
        localOnly: isLocalModel(picked),
        reason: `You chose ${picked.display_name}.`,
      };
    }
  }

  const taskType: TaskType = classifyTaskType(text);
  const routed = routeModel(taskType, plan, null, contextSize);
  return {
    model: routed.model,
    localOnly: isLocalModel(routed.model),
    reason: routed.reason,
  };
}

function localUnavailable(model: ModelInfo, detail: string): AIResponse {
  return {
    content: '',
    model: model.id,
    provider: 'ollama',
    tokensInput: 0,
    tokensOutput: 0,
    error: `${detail} ${model.display_name} only runs on this device, so NOVA will not use the cloud instead.`,
  };
}

/**
 * Runs one chat request through the chosen runtime.
 * Local modes are hard-gated: if the local runtime is missing, NOVA returns an
 * error instead of silently switching to the cloud.
 */
export async function orchestrateChat(
  messages: ChatMessage[],
  decision: RouteDecision,
  options?: ChatOptions,
): Promise<AIResponse> {
  const { model } = decision;

  if (decision.localOnly) {
    if (model.provider !== 'ollama') {
      return localUnavailable(model, 'This mode is misconfigured.');
    }
    const { baseUrl, model: localModel } = getOllamaSettings();
    const status = await checkLocalAI(baseUrl);
    if (!status.reachable) {
      return localUnavailable(model, status.error ?? `No local AI found at ${baseUrl}.`);
    }
    if (localModel && status.models.length > 0 && !status.models.includes(localModel)) {
      return localUnavailable(
        model,
        `The model "${localModel}" is not installed on this machine. Pick an installed model in Settings → Local AI.`,
      );
    }
    return getProvider('ollama').chat(messages, model.id, options);
  }

  return getProvider(model.provider).chat(messages, model.id, options);
}

/** Convenience wrapper: route then run. */
export async function askNova(
  messages: ChatMessage[],
  mode: string | null,
  plan: PlanTier,
  options?: ChatOptions,
): Promise<AIResponse & { decision: RouteDecision }> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const decision = routeRequest(mode, plan, lastUser?.content ?? '');
  const response = await orchestrateChat(messages, decision, options);
  return { ...response, decision };
}

/**
 * One-click check that the selected installed local model can actually answer.
 * Never touches the cloud.
 */
export async function testLocalModel(
  baseUrl: string,
  model: string,
): Promise<{ ok: boolean; reply: string; error: string | null; ms: number }> {
  const started = Date.now();
  const status = await checkLocalAI(baseUrl);
  if (!status.reachable) {
    return { ok: false, reply: '', error: status.error ?? 'Local AI is not reachable.', ms: Date.now() - started };
  }
  if (!model) {
    return { ok: false, reply: '', error: 'Pick a local model first.', ms: Date.now() - started };
  }
  if (status.models.length > 0 && !status.models.includes(model)) {
    return {
      ok: false,
      reply: '',
      error: `"${model}" is not installed on this machine. Install it yourself with Ollama, then select it here.`,
      ms: Date.now() - started,
    };
  }

  const response = await getProvider('ollama').chat(
    [{ role: 'user', content: 'Reply with exactly: OK' }],
    model,
    { systemPrompt: 'You are a connection test. Answer in one short word.', maxTokens: 20 },
  );

  if (response.error) {
    return { ok: false, reply: '', error: response.error, ms: Date.now() - started };
  }
  const reply = response.content.trim();
  if (!reply) {
    return { ok: false, reply: '', error: 'The local model answered with nothing.', ms: Date.now() - started };
  }
  return { ok: true, reply, error: null, ms: Date.now() - started };
}
