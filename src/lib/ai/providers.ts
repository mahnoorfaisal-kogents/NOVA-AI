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

export interface AIProvider {
  id: ProviderId;
  name: string;
  available: boolean;
  configured: boolean;
  chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
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

function withSystemPrompt(messages: ChatMessage[], systemPrompt?: string): ChatMessage[] {
  return [{ role: 'system', content: systemPrompt ?? DEFAULT_SYSTEM_PROMPT }, ...messages];
}

/**
 * Cloud inference through NOVA's own backend, which routes to OpenRouter and
 * falls back to NVIDIA NIM. API keys never reach the browser.
 */
class NovaCloudProvider implements AIProvider {
  id: ProviderId = 'nova_cloud';
  name = 'NOVA Cloud (OpenRouter → NVIDIA NIM)';
  available = true;
  configured = true;

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
        provider: result.provider,
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

/** Local inference on the user's own machine. Runs browser-side only. */
class OllamaProvider implements AIProvider {
  id: ProviderId = 'ollama';
  name = 'Ollama (Local)';
  available = true;
  configured = true;

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse> {
    const { baseUrl, model: configuredModel } = getOllamaSettings();
    const localModel = model === 'nova-local' ? configuredModel : model;

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
        return {
          content: '',
          model: localModel,
          provider: this.id,
          tokensInput: 0,
          tokensOutput: 0,
          error: `Local model request failed (${response.status}): ${detail.slice(0, 300)}`,
        };
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
        return {
          content: '',
          model: localModel,
          provider: this.id,
          tokensInput: 0,
          tokensOutput: 0,
          error: 'Request cancelled',
        };
      }
      return {
        content: '',
        model: localModel,
        provider: this.id,
        tokensInput: 0,
        tokensOutput: 0,
        error: `Could not reach Ollama at ${baseUrl}. Make sure it is running locally.`,
      };
    }
  }
}

const novaCloud = new NovaCloudProvider();
const ollama = new OllamaProvider();

const providers: Record<ProviderId, AIProvider> = {
  nova_cloud: novaCloud,
  openrouter: { ...novaCloud, id: 'openrouter', name: 'OpenRouter', chat: novaCloud.chat.bind(novaCloud) },
  nvidia_nim: { ...novaCloud, id: 'nvidia_nim', name: 'NVIDIA NIM', chat: novaCloud.chat.bind(novaCloud) },
  ollama,
};

export function getProvider(id: ProviderId): AIProvider {
  return providers[id];
}

export function getAvailableProviders(): AIProvider[] {
  return [novaCloud, ollama];
}

export async function sendChat(
  messages: ChatMessage[],
  model: ModelInfo,
  options?: ChatOptions
): Promise<AIResponse> {
  const provider = providers[model.provider] ?? providers.nova_cloud;
  return provider.chat(messages, model.id, options);
}
