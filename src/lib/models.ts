import type { ModelInfo, ModelCapability, PlanTier } from '@/types';

/**
 * NOVA's user-facing modes. People choose an intent, not a model name.
 * Cloud modes are answered by the managed AI runtime; local modes only ever
 * run on the user's own machine.
 */
export const MODELS: ModelInfo[] = [
  {
    id: 'nova-auto',
    provider: 'nova_cloud',
    name: 'nova-auto',
    display_name: 'Auto',
    description: 'NOVA picks the best mode for each message.',
    capabilities: ['general', 'reasoning', 'structured_output', 'multimodal'],
    context_window: 32000,
    max_output: 4000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
  {
    id: 'nova-fast',
    provider: 'nova_cloud',
    name: 'nova-fast',
    display_name: 'Fast',
    description: 'Quick answers for short, simple questions.',
    capabilities: ['general', 'fast', 'structured_output'],
    context_window: 16000,
    max_output: 2000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
  {
    id: 'nova-reasoning',
    provider: 'nova_cloud',
    name: 'nova-reasoning',
    display_name: 'Reasoning',
    description: 'Careful, step-by-step thinking for harder problems.',
    capabilities: ['reasoning', 'general', 'long_context'],
    context_window: 64000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-coding',
    provider: 'nova_cloud',
    name: 'nova-coding',
    display_name: 'Coding',
    description: 'Writing, reviewing and fixing code.',
    capabilities: ['coding', 'reasoning', 'structured_output'],
    context_window: 32000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-research',
    provider: 'nova_cloud',
    name: 'nova-research',
    display_name: 'Research',
    description: 'Longer, structured analysis of a topic.',
    capabilities: ['reasoning', 'long_context', 'general', 'vision'],
    context_window: 64000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-private',
    provider: 'ollama',
    name: 'nova-private',
    display_name: 'Private (on this device)',
    description: 'Answers are generated on your own machine. Nothing leaves it.',
    capabilities: ['general', 'fast', 'reasoning'],
    context_window: 8000,
    max_output: 4000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
  {
    id: 'nova-offline',
    provider: 'ollama',
    name: 'nova-offline',
    display_name: 'Offline (on this device)',
    description: 'Works without an internet connection for the AI part.',
    capabilities: ['general', 'fast'],
    context_window: 8000,
    max_output: 4000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
];

export function getModelsForPlan(plan: PlanTier): ModelInfo[] {
  const planRank = { free: 0, pro: 1, ultimate: 2 }[plan];
  return MODELS.filter((m) => {
    const modelRank = { free: 0, pro: 1, ultimate: 2 }[m.min_plan];
    return modelRank <= planRank && m.available;
  });
}

export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getDefaultModel(plan: PlanTier): ModelInfo {
  const models = getModelsForPlan(plan);
  return models[0] ?? MODELS[0];
}

export function hasCapability(model: ModelInfo, capability: ModelCapability): boolean {
  return model.capabilities.includes(capability);
}

export function isLocalModel(model: ModelInfo): boolean {
  return model.provider === 'ollama';
}

export function getBestModelForTask(
  taskType: 'simple' | 'reasoning' | 'coding' | 'vision' | 'long_document' | 'multimodal',
  plan: PlanTier
): ModelInfo {
  const available = getModelsForPlan(plan).filter((m) => m.provider === 'nova_cloud');

  const preferred: Record<string, string[]> = {
    simple: ['nova-fast', 'nova-auto'],
    reasoning: ['nova-reasoning', 'nova-auto'],
    coding: ['nova-coding', 'nova-auto'],
    vision: ['nova-auto'],
    long_document: ['nova-research', 'nova-reasoning', 'nova-auto'],
    multimodal: ['nova-auto'],
  };

  for (const id of preferred[taskType] ?? ['nova-auto']) {
    const match = available.find((m) => m.id === id);
    if (match) return match;
  }

  return available[0] ?? getDefaultModel(plan);
}
