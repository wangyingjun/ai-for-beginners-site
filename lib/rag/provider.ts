/**
 * LLM provider resolution: prefer per-request user credentials (ephemeral),
 * else fall back to server env. OpenAI-compatible first (Ollama / DeepSeek / …).
 * Never assume a key exists; never log secrets.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
  DEFAULT_CHAT_MODEL,
  LOCAL_API_KEY_PLACEHOLDER,
  type LlmApiType,
  type UserLlmSettings,
} from "./llm-settings";

export type ProviderConfig = {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  embeddingModel: string;
  apiType: LlmApiType;
  /** Where the key came from (for headers / UI — never includes the key). */
  source: "user" | "env";
};

export type ResolvedChatModel = {
  model: LanguageModel;
  config: ProviderConfig;
};

/** Server env only (OpenAI-compatible path). */
export function resolveEnvProviderConfig(): ProviderConfig | null {
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

  return {
    apiKey,
    baseURL: baseURL.replace(/\/+$/, ""),
    chatModel,
    embeddingModel,
    apiType: "openai-compatible",
    source: "env",
  };
}

/** @deprecated use resolveEnvProviderConfig */
export function resolveProviderConfig(): ProviderConfig | null {
  return resolveEnvProviderConfig();
}

export function providerConfigured(): boolean {
  return resolveEnvProviderConfig() !== null;
}

/**
 * Prefer user credentials when present; otherwise server env.
 * User keys are request-scoped only — caller must not persist them.
 */
export function resolveEffectiveConfig(
  user?: UserLlmSettings | null,
): ProviderConfig | null {
  if (user?.apiUrl?.trim()) {
    const apiType = user.apiType;
    const apiKey =
      user.apiKey?.trim() ||
      (apiType === "openai-compatible" ? LOCAL_API_KEY_PLACEHOLDER : "");
    if (!apiKey && apiType !== "openai-compatible") return null;

    return {
      apiKey: apiKey || LOCAL_API_KEY_PLACEHOLDER,
      baseURL: user.apiUrl.trim().replace(/\/+$/, ""),
      chatModel:
        user.chatModel?.trim() ||
        DEFAULT_CHAT_MODEL[apiType] ||
        "gpt-4o-mini",
      embeddingModel:
        process.env.AI_EMBEDDING_MODEL?.trim() ||
        "text-embedding-3-small",
      apiType,
      source: "user",
    };
  }
  return resolveEnvProviderConfig();
}

export function createChatModel(config: ProviderConfig): LanguageModel {
  switch (config.apiType) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return anthropic(config.chatModel);
    }
    case "azure-openai": {
      const azure = createAzure({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return azure.chat(config.chatModel);
    }
    case "openai-compatible":
    default: {
      // chat() uses /v1/chat/completions — works with Ollama, vLLM, DeepSeek, etc.
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return openai.chat(config.chatModel);
    }
  }
}

export function resolveChatModel(
  user?: UserLlmSettings | null,
): ResolvedChatModel | null {
  const config = resolveEffectiveConfig(user);
  if (!config) return null;
  return { model: createChatModel(config), config };
}

/** Human-readable reason when chat is unavailable (no secrets). */
export function missingKeyMessage(locale: "zh-CN" | "en" = "zh-CN"): string {
  if (locale === "en") {
    return "AI tutor has no LLM credentials. Pick a preset (Ollama / DeepSeek / …) in the assistant UI, or set OPENAI_API_KEY on the server — see docs/ai-tutor.md.";
  }
  return "AI 助教尚未配置 LLM。请在助教界面选择预设（Ollama / DeepSeek 等）并填写凭证，或在服务端设置 OPENAI_API_KEY，详见 docs/ai-tutor.md。";
}
