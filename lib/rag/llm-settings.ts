/**
 * Shared LLM credential types for browser localStorage + ephemeral /api/chat body.
 * Never persist keys server-side (no disk / Supabase / logs).
 */

export const LLM_API_TYPES = [
  "openai-compatible",
  "anthropic",
  "azure-openai",
] as const;

export type LlmApiType = (typeof LLM_API_TYPES)[number];

export type UserLlmSettings = {
  apiUrl: string;
  apiType: LlmApiType;
  apiKey: string;
  /** Chat model or Azure deployment name */
  chatModel?: string;
};

export const LLM_SETTINGS_STORAGE_KEY = "ai-tutor-llm-settings-v1";

export const API_TYPE_LABELS: Record<
  LlmApiType,
  { "zh-CN": string; en: string }
> = {
  "openai-compatible": {
    "zh-CN": "OpenAI 兼容",
    en: "OpenAI-compatible",
  },
  anthropic: {
    "zh-CN": "Anthropic",
    en: "Anthropic",
  },
  "azure-openai": {
    "zh-CN": "Azure OpenAI",
    en: "Azure OpenAI",
  },
};

export const DEFAULT_API_URL: Record<LlmApiType, string> = {
  "openai-compatible": "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  "azure-openai": "https://YOUR_RESOURCE.openai.azure.com/openai",
};

export const DEFAULT_CHAT_MODEL: Record<LlmApiType, string> = {
  "openai-compatible": "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  "azure-openai": "gpt-4o-mini",
};

export function isLlmApiType(value: unknown): value is LlmApiType {
  return (
    typeof value === "string" &&
    (LLM_API_TYPES as readonly string[]).includes(value)
  );
}

/** Validate shape for API body; does not log secrets. */
export function sanitizeUserCredentials(
  raw: unknown,
): UserLlmSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const apiKey = typeof o.apiKey === "string" ? o.apiKey.trim() : "";
  const apiUrl = typeof o.apiUrl === "string" ? o.apiUrl.trim() : "";
  if (!apiKey || !apiUrl) return null;
  if (!isLlmApiType(o.apiType)) return null;
  const chatModel =
    typeof o.chatModel === "string" && o.chatModel.trim()
      ? o.chatModel.trim()
      : undefined;
  return {
    apiKey,
    apiUrl,
    apiType: o.apiType,
    chatModel,
  };
}

export function settingsComplete(s: UserLlmSettings | null | undefined): boolean {
  return Boolean(s?.apiKey?.trim() && s?.apiUrl?.trim() && s?.apiType);
}
