import type { ProviderId, ModelInfo } from '@/types';

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

class NovaDefaultProvider implements AIProvider {
  id: ProviderId = 'nova_default';
  name = 'NOVA Default';
  available = true;
  configured = true;

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<AIResponse> {
    const systemMsg: ChatMessage = options?.systemPrompt
      ? { role: 'system', content: options.systemPrompt }
      : { role: 'system', content: 'You are NOVA, a personal AI assistant. You are helpful, knowledgeable, and concise.' };

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nova-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [systemMsg, ...messages],
          model,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 4000,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          content: '',
          model,
          provider: this.id,
          tokensInput: 0,
          tokensOutput: 0,
          error: `AI request failed (${response.status}): ${errText}`,
        };
      }

      const data = await response.json();
      return {
        content: data.content ?? '',
        model,
        provider: this.id,
        tokensInput: data.tokens_input ?? 0,
        tokensOutput: data.tokens_output ?? 0,
        error: data.error ?? null,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { content: '', model, provider: this.id, tokensInput: 0, tokensOutput: 0, error: 'Request cancelled' };
      }
      return {
        content: '',
        model,
        provider: this.id,
        tokensInput: 0,
        tokensOutput: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

const providers: Record<ProviderId, AIProvider> = {
  nova_default: new NovaDefaultProvider(),
  openai: { id: 'openai', name: 'OpenAI', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'openai', tokensInput: 0, tokensOutput: 0, error: 'OpenAI provider not configured. Add OPENAI_API_KEY in settings.' }) },
  anthropic: { id: 'anthropic', name: 'Anthropic', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'anthropic', tokensInput: 0, tokensOutput: 0, error: 'Anthropic provider not configured. Add ANTHROPIC_API_KEY in settings.' }) },
  gemini: { id: 'gemini', name: 'Google Gemini', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'gemini', tokensInput: 0, tokensOutput: 0, error: 'Gemini provider not configured.' }) },
  groq: { id: 'groq', name: 'Groq', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'groq', tokensInput: 0, tokensOutput: 0, error: 'Groq provider not configured.' }) },
  openai_compatible: { id: 'openai_compatible', name: 'OpenAI-Compatible', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'openai_compatible', tokensInput: 0, tokensOutput: 0, error: 'OpenAI-compatible endpoint not configured.' }) },
  ollama: { id: 'ollama', name: 'Ollama (Local)', available: false, configured: false, chat: async () => ({ content: '', model: '', provider: 'ollama', tokensInput: 0, tokensOutput: 0, error: 'Ollama not configured.' }) },
};

export function getProvider(id: ProviderId): AIProvider {
  return providers[id];
}

export function getAvailableProviders(): AIProvider[] {
  return Object.values(providers).filter((p) => p.available);
}

export async function sendChat(
  messages: ChatMessage[],
  model: ModelInfo,
  options?: ChatOptions
): Promise<AIResponse> {
  const provider = providers[model.provider] ?? providers.nova_default;
  return provider.chat(messages, model.id, options);
}
