import type { ModelInfo, ModelCapability, ProviderId, PlanTier } from '@/types';

export const MODELS: ModelInfo[] = [
  {
    id: 'nova-fast',
    provider: 'nova_default',
    name: 'nova-fast',
    display_name: 'NOVA Fast',
    capabilities: ['general', 'fast', 'structured_output'],
    context_window: 8000,
    max_output: 2000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
  {
    id: 'nova-standard',
    provider: 'nova_default',
    name: 'nova-standard',
    display_name: 'NOVA Standard',
    capabilities: ['general', 'reasoning', 'structured_output'],
    context_window: 16000,
    max_output: 4000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'free',
  },
  {
    id: 'nova-reasoning',
    provider: 'nova_default',
    name: 'nova-reasoning',
    display_name: 'NOVA Reasoning',
    capabilities: ['reasoning', 'general', 'long_context'],
    context_window: 32000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-coding',
    provider: 'nova_default',
    name: 'nova-coding',
    display_name: 'NOVA Coding',
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
    provider: 'nova_default',
    name: 'nova-research',
    display_name: 'NOVA Research',
    capabilities: ['reasoning', 'long_context', 'general'],
    context_window: 64000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-vision',
    provider: 'nova_default',
    name: 'nova-vision',
    display_name: 'NOVA Vision',
    capabilities: ['vision', 'multimodal', 'general'],
    context_window: 16000,
    max_output: 4000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'pro',
  },
  {
    id: 'nova-long-context',
    provider: 'nova_default',
    name: 'nova-long-context',
    display_name: 'NOVA Long Context',
    capabilities: ['long_context', 'general', 'reasoning'],
    context_window: 128000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'ultimate',
  },
  {
    id: 'nova-multimodal',
    provider: 'nova_default',
    name: 'nova-multimodal',
    display_name: 'NOVA Multimodal',
    capabilities: ['multimodal', 'vision', 'general', 'reasoning'],
    context_window: 32000,
    max_output: 8000,
    cost_per_1k_input: null,
    cost_per_1k_output: null,
    available: true,
    min_plan: 'ultimate',
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

export function getBestModelForTask(
  taskType: 'simple' | 'reasoning' | 'coding' | 'vision' | 'long_document' | 'multimodal',
  plan: PlanTier
): ModelInfo {
  const available = getModelsForPlan(plan);

  const capabilityMap: Record<string, ModelCapability[]> = {
    simple: ['fast'],
    reasoning: ['reasoning'],
    coding: ['coding'],
    vision: ['vision'],
    long_document: ['long_context'],
    multimodal: ['multimodal'],
  };

  const needed = capabilityMap[taskType] ?? ['general'];

  for (const cap of needed) {
    const match = available.find((m) => m.capabilities.includes(cap));
    if (match) return match;
  }

  return available[0] ?? getDefaultModel(plan);
}
