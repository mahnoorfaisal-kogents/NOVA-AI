import type { ProviderId, ModelInfo } from '@/types';
import { novaCloudChat } from '@/lib/ai/hybrid.functions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: ProviderId;
  tokensInput: number;
  tokensOutput: number;
  error: string | null;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  id: ProviderId;
  name: string;
  chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse>;
}

const DEFAULT_SYSTEM_PROMPT =
  'You are NOVA, a personal AI assistant. You are helpful, knowledgeable, and concise.';

const OLLAMA_URL_KEY = 'nova.ollama.baseUrl';
const OLLAMA_MODEL_KEY = 'nova.ollama.model';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'llama3.1';

export function getOllamaSettings(): { baseUrl: string; model: string } {
  if (typeof window === 'undefined') {
    return { baseUrl: DEFAULT_OLLAMA_URL, model: DEFAULT_OLLAMA_MODEL };
  }
  return {
    baseUrl: window.localStorage.getItem(OLLAMA_URL_KEY) || DEFAULT_OLLAMA_URL,
    model: window.localStorage.getItem(OLLAMA_MODEL_KEY) || DEFAULT_OLLAMA_MODEL,
  };
}

export function setOllamaSettings(settings: { baseUrl: string; model: string }): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OLLAMA_URL_KEY, settings.baseUrl);
  window.localStorage.setItem(OLLAMA_MODEL_KEY, settings.model);
}

export interface LocalStatus {
  reachable: boolean;
  models: string[];
  error: string | null;
}

/**
 * Detects whether a local AI runtime is reachable and lists the models that
 * are already installed. Nothing is ever downloaded automatically.
 */
export async function checkLocalAI(baseUrl?: string): Promise<LocalStatus> {
  const url = (baseUrl ?? getOllamaSettings().baseUrl).replace(/\/$/, '');
  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) {
      return { reachable: false, models: [], error: `Local AI answered with status ${response.status}.` };
    }
    const data = (await response.json()) as { models?: Array<{ name?: string }> };
    const models = (data.models ?? []).map((m) => m.name ?? '').filter(Boolean);
    return { reachable: true, models, error: null };
  } catch {
    return {
      reachable: false,
      models: [],
      error: `No local AI found at ${url}. Start Ollama on this machine and try again.`,
    };
  }
}

/** Models Ollama publishes that are small enough for most laptops. */
export const SUGGESTED_LOCAL_MODELS = [
  { name: 'llama3.2:3b', size: '~2 GB', note: 'Smallest — good on any laptop' },
  { name: 'llama3.1:8b', size: '~4.7 GB', note: 'Balanced everyday model' },
  { name: 'qwen2.5:7b', size: '~4.7 GB', note: 'Strong at reasoning' },
  { name: 'qwen2.5-coder:7b', size: '~4.7 GB', note: 'Best for code' },
  { name: 'mistral:7b', size: '~4.1 GB', note: 'Fast general model' },
] as const;

export interface PullProgress {
  status: string;
  /** 0-100, or null when the server has not reported sizes yet. */
  percent: number | null;
  completedBytes: number;
  totalBytes: number;
}

/**
 * Downloads and installs a model onto the user's own machine through Ollama.
 * Only ever called from an explicit user action — NOVA never starts a download
 * on its own. Reports progress as the download streams.
 */
export async function pullLocalModel(
  model: string,
  baseUrl?: string,
  onProgress?: (progress: PullProgress) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; error: string | null }> {
  const url = (baseUrl ?? getOllamaSettings().baseUrl).replace(/\/$/, '');
  try {
    const response = await fetch(`${url}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream: true }),
      signal: signal ?? null,
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, error: `Install failed (${response.status}): ${detail.slice(0, 300)}` };
    }
    if (!response.body) {
      return { ok: false, error: 'The local AI server sent no progress information.' };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastError: string | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let event: { status?: string; error?: string; completed?: number; total?: number };
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.error) {
          lastError = event.error;
          continue;
        }
        const completed = event.completed ?? 0;
        const total = event.total ?? 0;
        onProgress?.({
          status: event.status ?? 'downloading',
          percent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : null,
          completedBytes: completed,
          totalBytes: total,
        });
      }
    }

    if (lastError) {
      return { ok: false, error: `${lastError} Check the model name — it must exist in the Ollama library.` };
    }
    return { ok: true, error: null };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: 'Install cancelled. Nothing else was downloaded.' };
    }
    return {
      ok: false,
      error: `No local AI found at ${url}. Start Ollama on this machine, then try installing again.`,
    };
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function withSystemPrompt(messages: ChatMessage[], systemPrompt?: string): ChatMessage[] {
  return [{ role: 'system', content: systemPrompt ?? DEFAULT_SYSTEM_PROMPT }, ...messages];
}

/** Cloud inference through NOVA's own backend and the managed AI runtime. */
class NovaCloudProvider implements AIProvider {
  id: ProviderId = 'nova_cloud';
  name = 'NOVA Cloud';

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse> {
    try {
      const result = await novaCloudChat({
        data: {
          messages: withSystemPrompt(messages, options?.systemPrompt),
          model,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 4000,
        },
      });

      return {
        content: result.content,
        model,
        provider: 'nova_cloud',
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        error: result.error,
      };
    } catch (err) {
      return {
        content: '',
        model,
        provider: this.id,
        tokensInput: 0,
        tokensOutput: 0,
        error: err instanceof Error ? err.message : 'Cloud AI request failed',
      };
    }
  }
}

/**
 * Local inference on the user's own machine. Runs browser-side only and never
 * falls back to the cloud, so Private/Offline modes stay on this device.
 */
class OllamaProvider implements AIProvider {
  id: ProviderId = 'ollama';
  name = 'On this device';

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse> {
    const { baseUrl, model: configuredModel } = getOllamaSettings();
    const localModel = model.startsWith('nova-') ? configuredModel : model;
    const fail = (error: string): AIResponse => ({
      content: '',
      model: localModel,
      provider: this.id,
      tokensInput: 0,
      tokensOutput: 0,
      error,
    });

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: localModel,
          messages: withSystemPrompt(messages, options?.systemPrompt),
          stream: false,
          options: { temperature: options?.temperature ?? 0.7 },
        }),
        signal: options?.signal ?? null,
      });

      if (!response.ok) {
        const detail = await response.text();
        return fail(`Local AI request failed (${response.status}): ${detail.slice(0, 300)}`);
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      return {
        content: data.message?.content ?? '',
        model: localModel,
        provider: this.id,
        tokensInput: data.prompt_eval_count ?? 0,
        tokensOutput: data.eval_count ?? 0,
        error: null,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return fail('Request cancelled');
      }
      return fail(
        `No local AI found at ${baseUrl}. This mode only runs on your own machine, so NOVA will not use the cloud instead.`,
      );
    }
  }
}

const novaCloud = new NovaCloudProvider();
const ollama = new OllamaProvider();

const providers: Record<ProviderId, AIProvider> = {
  nova_cloud: novaCloud,
  ollama,
};

export function getProvider(id: ProviderId): AIProvider {
  return providers[id] ?? novaCloud;
}

export function getAvailableProviders(): AIProvider[] {
  return [novaCloud, ollama];
}

export function providerLabel(id: ProviderId | null): string {
  if (id === 'ollama') return 'On this device';
  return 'NOVA Cloud';
}

export async function sendChat(
  messages: ChatMessage[],
  model: ModelInfo,
  options?: ChatOptions
): Promise<AIResponse> {
  const provider = providers[model.provider] ?? providers.nova_cloud;
  return provider.chat(messages, model.id, options);
}
