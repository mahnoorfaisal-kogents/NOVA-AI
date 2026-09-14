import type { PlanTier, PlanInfo, PlanLimits } from '@/types';

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    max_messages_per_day: 50,
    max_memory_items: 100,
    max_context_tokens: 8000,
    max_file_storage_mb: 50,
    max_files: 25,
    max_projects: 3,
    max_tasks: 50,
    max_agents: 3,
    max_automations: 2,
    allowed_models: ['nova-auto', 'nova-fast', 'nova-private', 'nova-offline'],
    coding: false,
    research: false,
    data_analysis: false,
    voice: false,
    multimodal: false,
    advanced_agents: false,
    file_versioning: false,
    knowledge_graph: false,
  },
  pro: {
    max_messages_per_day: 500,
    max_memory_items: 1000,
    max_context_tokens: 32000,
    max_file_storage_mb: 500,
    max_files: 200,
    max_projects: 25,
    max_tasks: 500,
    max_agents: 15,
    max_automations: 25,
    allowed_models: ['nova-auto', 'nova-fast', 'nova-reasoning', 'nova-coding', 'nova-research', 'nova-private', 'nova-offline'],
    coding: true,
    research: true,
    data_analysis: true,
    voice: true,
    multimodal: true,
    advanced_agents: true,
    file_versioning: true,
    knowledge_graph: false,
  },
  ultimate: {
    max_messages_per_day: 2000,
    max_memory_items: 10000,
    max_context_tokens: 128000,
    max_file_storage_mb: 5000,
    max_files: 1000,
    max_projects: 100,
    max_tasks: 5000,
    max_agents: 50,
    max_automations: 100,
    allowed_models: [
      'nova-auto', 'nova-fast', 'nova-reasoning', 'nova-coding',
      'nova-research', 'nova-private', 'nova-offline',
    ],
    coding: true,
    research: true,
    data_analysis: true,
    voice: true,
    multimodal: true,
    advanced_agents: true,
    file_versioning: true,
    knowledge_graph: true,
  },
};

export const PLANS: Record<PlanTier, PlanInfo> = {
  free: {
    tier: 'free',
    name: 'NOVA Free',
    description: 'Your starter AI companion with essential intelligence.',
    limits: PLAN_LIMITS.free,
    features: [
      'Basic AI chat with conversation history',
      'Personal memory (up to 100 items)',
      'Up to 3 projects',
      'Basic task management',
      '3 specialized agents',
      '2 automations',
      'Standard AI models',
    ],
    price_monthly: 0,
  },
  pro: {
    tier: 'pro',
    name: 'NOVA Pro',
    description: 'Your daily professional AI workspace.',
    limits: PLAN_LIMITS.pro,
    features: [
      '500 messages per day',
      'Advanced memory (1,000 items)',
      'Coding & research assistants',
      'Data analysis tools',
      '15 specialized agents',
      '25 automations',
      'Voice & multimodal input',
      'File versioning',
      'Advanced model routing',
      '500MB file storage',
    ],
    price_monthly: 20,
  },
  ultimate: {
    tier: 'ultimate',
    name: 'NOVA Ultimate',
    description: 'The complete personal AI operating system.',
    limits: PLAN_LIMITS.ultimate,
    features: [
      '2,000 messages per day',
      'Maximum memory (10,000 items)',
      'All advanced agents & automations',
      'Knowledge graph & semantic timeline',
      'Premium model access',
      '128K context window',
      '5GB file storage',
      'Advanced research workflows',
      'Priority AI routing',
      'Full personalization suite',
    ],
    price_monthly: 50,
  },
};

export function getPlanInfo(tier: PlanTier): PlanInfo {
  return PLANS[tier];
}

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier];
}

export function canAccessFeature(tier: PlanTier, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[tier];
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return true;
}

export function getPlanRank(tier: PlanTier): number {
  return { free: 0, pro: 1, ultimate: 2 }[tier];
}

export function isPlanAtLeast(tier: PlanTier, minTier: PlanTier): boolean {
  return getPlanRank(tier) >= getPlanRank(minTier);
}
