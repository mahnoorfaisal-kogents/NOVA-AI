import type { PlanTier, ModelInfo, ModelCapability } from '@/types';
import { getModelsForPlan, getBestModelForTask } from '@/lib/models';

export type TaskType = 'simple' | 'reasoning' | 'coding' | 'vision' | 'long_document' | 'multimodal';

export interface RoutingResult {
  model: ModelInfo;
  reason: string;
  fallback: ModelInfo | null;
}

export function routeModel(
  taskType: TaskType,
  plan: PlanTier,
  userOverride?: string | null,
  contextSize?: number
): RoutingResult {
  const availableModels = getModelsForPlan(plan);

  if (availableModels.length === 0) {
    return { model: availableModels[0], reason: 'No models available', fallback: null };
  }

  if (userOverride) {
    const overrideModel = availableModels.find((m) => m.id === userOverride);
    if (overrideModel) {
      return { model: overrideModel, reason: 'User-selected model', fallback: null };
    }
  }

  if (contextSize) {
    const longEnough = availableModels.filter((m) => m.context_window >= contextSize);
    if (longEnough.length > 0) {
      const best = getBestModelForTask(taskType, plan);
      const match = longEnough.find((m) => m.id === best.id) ?? longEnough[0];
      return {
        model: match,
        reason: `Selected for ${taskType} task with ${contextSize} token context`,
        fallback: availableModels.find((m) => m.id !== match.id) ?? null,
      };
    }
  }

  const best = getBestModelForTask(taskType, plan);
  const fallback = availableModels.find((m) => m.id !== best.id) ?? null;

  return {
    model: best,
    reason: `Auto-routed for ${taskType} task`,
    fallback,
  };
}

export function classifyTaskType(input: string): TaskType {
  const lower = input.toLowerCase();

  if (lower.match(/\b(code|function|bug|debug|refactor|program|api|class|typescript|python|javascript|react|sql)\b/)) {
    return 'coding';
  }

  if (lower.match(/\b(image|photo|picture|see|look at|vision|diagram)\b/)) {
    return 'vision';
  }

  if (lower.match(/\b(analyze|document|large file|entire file|whole file|read this)\b/) && input.length > 2000) {
    return 'long_document';
  }

  if (lower.match(/\b(analyze|reason|think through|step by step|why|explain why|deduce|infer)\b/)) {
    return 'reasoning';
  }

  if (input.length < 100 && lower.match(/\b(hi|hello|hey|thanks|ok|yes|no|bye)\b/)) {
    return 'simple';
  }

  return 'simple';
}

export function getModelCapabilities(model: ModelInfo): ModelCapability[] {
  return model.capabilities;
}
