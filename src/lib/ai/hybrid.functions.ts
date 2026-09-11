/**
 * Hybrid AI backend for NOVA.
 *
 * Cloud inference is served by OpenRouter (primary) with NVIDIA NIM as the
 * fallback. Local inference (Ollama) runs entirely in the browser and never
 * reaches this file, because the local endpoint lives on the user's machine.
 *
 * No other providers are supported by design.
 */
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/** NOVA's virtual models mapped onto real upstream model names. */
const MODEL_MAP: Record<string, { openrouter: string; nim: string }> = {
  "nova-fast": {
    openrouter: "meta-llama/llama-3.1-8b-instruct",
    nim: "meta/llama-3.1-8b-instruct",
  },
  "nova-standard": {
    openrouter: "meta-llama/llama-3.3-70b-instruct",
    nim: "meta/llama-3.3-70b-instruct",
  },
  "nova-reasoning": {
    openrouter: "deepseek/deepseek-r1",
    nim: "deepseek-ai/deepseek-r1",
  },
  "nova-coding": {
    openrouter: "qwen/qwen-2.5-coder-32b-instruct",
    nim: "qwen/qwen2.5-coder-32b-instruct",
  },
  "nova-research": {
    openrouter: "meta-llama/llama-3.3-70b-instruct",
    nim: "meta/llama-3.3-70b-instruct",
  },
  "nova-vision": {
    openrouter: "qwen/qwen2.5-vl-72b-instruct",
    nim: "meta/llama-3.2-90b-vision-instruct",
  },
  "nova-long-context": {
    openrouter: "meta-llama/llama-3.3-70b-instruct",
    nim: "meta/llama-3.3-70b-instruct",
  },
  "nova-multimodal": {
    openrouter: "qwen/qwen2.5-vl-72b-instruct",
    nim: "meta/llama-3.2-90b-vision-instruct",
  },
};

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
});

type ChatInputType = z.infer<typeof ChatInput>;

interface UpstreamResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  upstreamModel: string;
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  upstreamModel: string,
  input: ChatInputType,
  extraHeaders: Record<string, string> = {},
): Promise<UpstreamResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: upstreamModel,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 4000,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${response.status}: ${detail.slice(0, 400)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensInput: data.usage?.prompt_tokens ?? 0,
    tokensOutput: data.usage?.completion_tokens ?? 0,
    upstreamModel,
  };
}

/**
 * Cloud chat completion. Tries OpenRouter first, then NVIDIA NIM.
 * Requires an authenticated NOVA user.
 */
export const novaCloudChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const mapping = MODEL_MAP[data.model] ?? MODEL_MAP["nova-standard"]!;
    const openRouterKey = process.env["OPENROUTER_API_KEY"];
    const nimKey = process.env["NVIDIA_NIM_API_KEY"];
    const failures: string[] = [];

    if (openRouterKey) {
      try {
        const result = await callOpenAICompatible(
          OPENROUTER_URL,
          openRouterKey,
          mapping.openrouter,
          data,
          { "X-Title": "NOVA" },
        );
        return { ...result, provider: "openrouter" as const, error: null as string | null };
      } catch (err) {
        failures.push(`OpenRouter — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    } else {
      failures.push("OpenRouter — not configured");
    }

    if (nimKey) {
      try {
        const result = await callOpenAICompatible(NIM_URL, nimKey, mapping.nim, data);
        return { ...result, provider: "nvidia_nim" as const, error: null as string | null };
      } catch (err) {
        failures.push(`NVIDIA NIM — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    } else {
      failures.push("NVIDIA NIM — not configured");
    }

    return {
      content: "",
      tokensInput: 0,
      tokensOutput: 0,
      upstreamModel: "",
      provider: "openrouter" as const,
      error: `No cloud AI provider answered. ${failures.join("; ")}`,
    };
  });

/** Reports which cloud providers have credentials, for the settings screen. */
export const novaCloudStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    openrouter: Boolean(process.env["OPENROUTER_API_KEY"]),
    nvidia_nim: Boolean(process.env["NVIDIA_NIM_API_KEY"]),
  }));
