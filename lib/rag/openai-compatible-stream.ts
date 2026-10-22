/**
 * Browser-side OpenAI-compatible chat completions streaming (SSE).
 * Used for localhost Ollama / LM Studio so Vercel never has to reach the learner's machine.
 */

import type { UserLlmSettings } from "./llm-settings";
import { LOCAL_API_KEY_PLACEHOLDER, normalizeApiUrl } from "./llm-settings";

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export type StreamChatOptions = {
  settings: UserLlmSettings;
  messages: ChatTurn[];
  system?: string;
  temperature?: number;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
};

function joinUrl(base: string, path: string): string {
  const b = normalizeApiUrl(base);
  if (b.endsWith("/v1") && path.startsWith("/v1/")) {
    return `${b.slice(0, -3)}${path}`;
  }
  if (path.startsWith("http")) return path;
  return `${b}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Stream assistant text from POST {base}/chat/completions (stream: true).
 * Returns the full accumulated assistant content.
 */
export async function streamOpenAICompatibleChat(
  opts: StreamChatOptions,
): Promise<string> {
  const { settings, messages, system, temperature = 0.3, signal, onDelta } =
    opts;
  const base = normalizeApiUrl(settings.apiUrl);
  const url = joinUrl(base, "/chat/completions");
  const model = settings.chatModel?.trim() || "llama3.2";
  const apiKey = settings.apiKey?.trim() || LOCAL_API_KEY_PLACEHOLDER;

  const bodyMessages: ChatTurn[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: bodyMessages,
      temperature,
      stream: true,
    }),
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    const snip = detail.slice(0, 280);
    throw new Error(
      `LLM HTTP ${res.status}${snip ? `: ${snip}` : ""} (URL: ${url})`,
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from LLM");

  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{
            delta?: { content?: string | null };
            message?: { content?: string | null };
          }>;
        };
        const piece =
          parsed.choices?.[0]?.delta?.content ??
          parsed.choices?.[0]?.message?.content ??
          "";
        if (piece) {
          acc += piece;
          onDelta(acc);
        }
      } catch {
        /* ignore malformed SSE chunks */
      }
    }
  }

  return acc;
}
