export type PlanTier = 'free' | 'pro' | 'ultimate';

export type PersonalityType =
  | 'professional'
  | 'concise'
  | 'detailed'
  | 'technical'
  | 'creative'
  | 'friendly'
  | 'analytical'
  | 'custom';

export type AgentType =
  | 'general'
  | 'research'
  | 'coding'
  | 'writing'
  | 'data_analysis'
  | 'planning'
  | 'productivity'
  | 'file_analyst'
  | 'security'
  | 'automation'
  | 'verification';

export type AgentStatus = 'idle' | 'planning' | 'executing' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type MemoryCategory =
  | 'personal'
  | 'preferences'
  | 'work'
  | 'technical'
  | 'projects'
  | 'goals'
  | 'instructions'
  | 'important_facts'
  | 'temporary';

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'sent' | 'streaming' | 'complete' | 'error';

export type AutomationTrigger = 'schedule' | 'task_event' | 'file_event' | 'project_event' | 'user_command';
export type AutomationActionType =
  | 'ai_invocation'
  | 'task_creation'
  | 'task_update'
  | 'memory_update'
  | 'notification'
  | 'file_processing';

export type PermissionLevel = 'safe' | 'confirm' | 'high_risk';
export type PermissionDecision = 'always_allow' | 'ask_every_time' | 'allow_once' | 'deny';

export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openai_compatible' | 'ollama' | 'nova_default';

export type ModelCapability =
  | 'general'
  | 'reasoning'
  | 'coding'
  | 'vision'
  | 'long_context'
  | 'fast'
  | 'structured_output'
  | 'multimodal';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanTier;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  project_id: string | null;
  folder_id: string | null;
  pinned: boolean;
  archived: boolean;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  model: string | null;
  provider: ProviderId | null;
  status: MessageStatus;
  parent_message_id: string | null;
  branch_id: string | null;
  tokens: number | null;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  content: string;
  importance: number;
  confidence: number;
  source: string;
  user_confirmed: boolean;
  project_id: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  last_accessed: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  file_type: string;
  file_size: number;
  storage_path: string | null;
  content_text: string | null;
  summary: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  version: number;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  parent_task_id: string | null;
  tags: string[];
  ai_created: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  type: AgentType;
  instructions: string | null;
  model: string | null;
  tools: string[];
  permissions: PermissionLevel;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  agent_id: string;
  project_id: string | null;
  status: AgentStatus;
  goal: string;
  plan: unknown;
  result: string | null;
  error: string | null;
  steps: AgentRunStep[];
  created_at: string;
  completed_at: string | null;
}

export interface AgentRunStep {
  step: number;
  action: string;
  tool: string | null;
  status: string;
  result: string | null;
  timestamp: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  trigger_type: AutomationTrigger;
  trigger_config: Record<string, unknown>;
  conditions: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  enabled: boolean;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  user_id: string;
  automation_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Preference {
  id: string;
  user_id: string;
  key: string;
  value: string;
  category: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  resource_type: string;
  model: string | null;
  provider: ProviderId | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_estimate: number | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  actor: string;
  agent_id: string | null;
  tool: string | null;
  action: string;
  permission: string | null;
  result: string;
  failure_reason: string | null;
  approval_id: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version: number;
  content_text: string | null;
  storage_path: string | null;
  change_description: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  user_id: string;
  agent_id: string | null;
  agent_run_id: string | null;
  action: string;
  description: string;
  data_involved: string | null;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  created_at: string;
  resolved_at: string | null;
}

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  summary: string;
  key_points: string[];
  topics: string[];
  message_range_start: number;
  message_range_end: number;
  created_at: string;
}

export interface KnowledgeEntity {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  relationships: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string | null;
  semantic_tags: string[];
  created_at: string;
}

export interface ModelInfo {
  id: string;
  provider: ProviderId;
  name: string;
  display_name: string;
  capabilities: ModelCapability[];
  context_window: number;
  max_output: number;
  cost_per_1k_input: number | null;
  cost_per_1k_output: number | null;
  available: boolean;
  min_plan: PlanTier;
}

export interface PlanInfo {
  tier: PlanTier;
  name: string;
  description: string;
  limits: PlanLimits;
  features: string[];
  price_monthly: number;
}

export interface PlanLimits {
  max_messages_per_day: number;
  max_memory_items: number;
  max_context_tokens: number;
  max_file_storage_mb: number;
  max_files: number;
  max_projects: number;
  max_tasks: number;
  max_agents: number;
  max_automations: number;
  allowed_models: string[];
  coding: boolean;
  research: boolean;
  data_analysis: boolean;
  voice: boolean;
  multimodal: boolean;
  advanced_agents: boolean;
  file_versioning: boolean;
  knowledge_graph: boolean;
}
