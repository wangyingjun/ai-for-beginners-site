/**
 * Shared LLM credential types for browser localStorage + ephemeral /api/chat body.
 * Open-source first: OpenAI-compatible endpoints (Ollama, DeepSeek, SiliconFlow, …).
 * Never persist keys server-side (no disk / Supabase / logs).
 */

export const LLM_API_TYPES = [
  "openai-compatible",
  "anthropic",
  "azure-openai",
] as const;

export type LlmApiType = (typeof LLM_API_TYPES)[number];

/** One-click presets — all OpenAI-compatible except where noted. */
export const LLM_PRESETS = [
  "ollama",
  "deepseek",
  "siliconflow",
  "openrouter",
  "openai",
  "custom",
] as const;

export type LlmPreset = (typeof LLM_PRESETS)[number];

export type UserLlmSettings = {
  apiUrl: string;
  apiType: LlmApiType;
  apiKey: string;
  /** Chat model or Azure deployment name */
  chatModel?: string;
  /** Optional UI preset id (informational; url/model win). */
  preset?: LlmPreset;
};

export const LLM_SETTINGS_STORAGE_KEY = "ai-tutor-llm-settings-v1";

export const API_TYPE_LABELS: Record<
  LlmApiType,
  { "zh-CN": string; en: string }
> = {
  "openai-compatible": {
    "zh-CN": "OpenAI 兼容（推荐 / 开源）",
    en: "OpenAI-compatible (recommended / OSS)",
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

export type PresetDef = {
  id: LlmPreset;
  label: { "zh-CN": string; en: string };
  apiType: LlmApiType;
  apiUrl: string;
  chatModel: string;
  /** Local Ollama / LM Studio — empty key OK */
  keyOptional: boolean;
  hint: { "zh-CN": string; en: string };
};

export const PRESET_DEFS: Record<LlmPreset, PresetDef> = {
  ollama: {
    id: "ollama",
    label: { "zh-CN": "Ollama（本机）", en: "Ollama (local)" },
    apiType: "openai-compatible",
    apiUrl: "http://127.0.0.1:11434/v1",
    chatModel: "llama3.2",
    keyOptional: true,
    hint: {
      "zh-CN":
        "浏览器直连本机 Ollama。需允许 CORS（OLLAMA_ORIGINS）。线上 Vercel 无法代连你的 localhost。",
      en: "Browser talks to local Ollama. Enable CORS (OLLAMA_ORIGINS). Vercel cannot reach your localhost.",
    },
  },
  deepseek: {
    id: "deepseek",
    label: { "zh-CN": "DeepSeek", en: "DeepSeek" },
    apiType: "openai-compatible",
    apiUrl: "https://api.deepseek.com/v1",
    chatModel: "deepseek-chat",
    keyOptional: false,
    hint: {
      "zh-CN": "经本站 /api/chat 代理（服务端流式），Key 仅内存使用。",
      en: "Proxied via /api/chat (server stream); key used in memory only.",
    },
  },
  siliconflow: {
    id: "siliconflow",
    label: { "zh-CN": "硅基流动 SiliconFlow", en: "SiliconFlow" },
    apiType: "openai-compatible",
    apiUrl: "https://api.siliconflow.cn/v1",
    chatModel: "deepseek-ai/DeepSeek-V3",
    keyOptional: false,
    hint: {
      "zh-CN": "OpenAI 兼容云端；经 /api/chat 代理。",
      en: "OpenAI-compatible cloud; proxied via /api/chat.",
    },
  },
  openrouter: {
    id: "openrouter",
    label: { "zh-CN": "OpenRouter", en: "OpenRouter" },
    apiType: "openai-compatible",
    apiUrl: "https://openrouter.ai/api/v1",
    chatModel: "openai/gpt-4o-mini",
    keyOptional: false,
    hint: {
      "zh-CN": "可选用开源模型路由；经 /api/chat 代理。",
      en: "Route to open models; proxied via /api/chat.",
    },
  },
  openai: {
    id: "openai",
    label: { "zh-CN": "OpenAI 官方", en: "OpenAI official" },
    apiType: "openai-compatible",
    apiUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    keyOptional: false,
    hint: {
      "zh-CN": "官方 API；也可换成任何兼容网关。",
      en: "Official API; any compatible gateway works the same.",
    },
  },
  custom: {
    id: "custom",
    label: { "zh-CN": "自定义 / LM Studio / vLLM", en: "Custom / LM Studio / vLLM" },
    apiType: "openai-compatible",
    apiUrl: "http://127.0.0.1:1234/v1",
    chatModel: "local-model",
    keyOptional: true,
    hint: {
      "zh-CN": "任意 OpenAI 兼容 Base URL（LM Studio、vLLM、OneAPI 等）。本机地址走浏览器直连。",
      en: "Any OpenAI-compatible base URL. Localhost uses browser-direct streaming.",
    },
  },
};

export const DEFAULT_API_URL: Record<LlmApiType, string> = {
  "openai-compatible": PRESET_DEFS.ollama.apiUrl,
  anthropic: "https://api.anthropic.com/v1",
  "azure-openai": "https://YOUR_RESOURCE.openai.azure.com/openai",
};

export const DEFAULT_CHAT_MODEL: Record<LlmApiType, string> = {
  "openai-compatible": PRESET_DEFS.ollama.chatModel,
  anthropic: "claude-3-5-haiku-latest",
  "azure-openai": "gpt-4o-mini",
};

/** Placeholder when local OpenAI-compatible servers ignore the key. */
export const LOCAL_API_KEY_PLACEHOLDER = "ollama";

export function isLlmApiType(value: unknown): value is LlmApiType {
  return (
    typeof value === "string" &&
    (LLM_API_TYPES as readonly string[]).includes(value)
  );
}

export function isLlmPreset(value: unknown): value is LlmPreset {
  return (
    typeof value === "string" &&
    (LLM_PRESETS as readonly string[]).includes(value)
  );
}

/** True when the browser can (and should) call the endpoint directly. */
export function isLocalOpenAIEndpoint(apiUrl: string): boolean {
  try {
    const u = new URL(apiUrl.trim());
    const host = u.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Validate shape for API body / localStorage.
 * Allows empty apiKey for local OpenAI-compatible endpoints (Ollama / LM Studio).
 */
export function sanitizeUserCredentials(
  raw: unknown,
): UserLlmSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const apiUrlRaw = typeof o.apiUrl === "string" ? o.apiUrl.trim() : "";
  if (!apiUrlRaw) return null;
  if (!isLlmApiType(o.apiType)) return null;

  let apiKey = typeof o.apiKey === "string" ? o.apiKey.trim() : "";
  const local =
    o.apiType === "openai-compatible" && isLocalOpenAIEndpoint(apiUrlRaw);

  if (!apiKey) {
    if (local) {
      apiKey = LOCAL_API_KEY_PLACEHOLDER;
    } else {
      return null;
    }
  }

  const chatModel =
    typeof o.chatModel === "string" && o.chatModel.trim()
      ? o.chatModel.trim()
      : undefined;
  const preset = isLlmPreset(o.preset) ? o.preset : undefined;

  return {
    apiKey,
    apiUrl: normalizeApiUrl(apiUrlRaw),
    apiType: o.apiType,
    chatModel,
    preset,
  };
}

export function settingsComplete(
  s: UserLlmSettings | null | undefined,
): boolean {
  if (!s?.apiUrl?.trim() || !s?.apiType) return false;
  const local =
    s.apiType === "openai-compatible" && isLocalOpenAIEndpoint(s.apiUrl);
  if (local) return true;
  return Boolean(s.apiKey?.trim());
}

export function applyPreset(preset: LlmPreset): UserLlmSettings {
  const def = PRESET_DEFS[preset];
  return {
    apiType: def.apiType,
    apiUrl: def.apiUrl,
    apiKey: def.keyOptional ? "" : "",
    chatModel: def.chatModel,
    preset,
  };
}
