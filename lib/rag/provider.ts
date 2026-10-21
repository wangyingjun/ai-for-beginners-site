/**
 * LLM provider abstraction via env.
 * Supports OpenAI official keys or any OpenAI-compatible gateway
 * (AI_GATEWAY_* / OPENAI_BASE_URL). No key is assumed to exist.
 */

export type ProviderConfig = {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  embeddingModel: string;
};

export function resolveProviderConfig(): ProviderConfig | null {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim() ||
    "";

  if (!apiKey) return null;

  const baseURL =
    process.env.OPENAI_BASE_URL?.trim() ||
    process.env.AI_GATEWAY_BASE_URL?.trim() ||
    process.env.AI_BASE_URL?.trim() ||
    "https://api.openai.com/v1";

  const chatModel =
    process.env.AI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    "gpt-4o-mini";

  const embeddingModel =
    process.env.AI_EMBEDDING_MODEL?.trim() ||
    process.env.OPENAI_EMBEDDING_MODEL?.trim() ||
    "text-embedding-3-small";

  return { apiKey, baseURL, chatModel, embeddingModel };
}

export function providerConfigured(): boolean {
  return resolveProviderConfig() !== null;
}

/** Human-readable reason when chat is unavailable (no secrets). */
export function missingKeyMessage(locale: "zh-CN" | "en" = "zh-CN"): string {
  if (locale === "en") {
    return "AI tutor is not configured yet. Set OPENAI_API_KEY (or AI_GATEWAY_API_KEY) — see docs/ai-tutor.md.";
  }
  return "AI 助教尚未配置。请设置 OPENAI_API_KEY（或 AI_GATEWAY_API_KEY），详见 docs/ai-tutor.md。";
}
