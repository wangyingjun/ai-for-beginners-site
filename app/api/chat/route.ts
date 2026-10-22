import { streamText } from "ai";
import { NextResponse } from "next/server";
import { encodeCitationsHeader } from "@/lib/rag/citations-header";
import {
  LLM_API_TYPES,
  LLM_PRESETS,
  isLocalOpenAIEndpoint,
  sanitizeUserCredentials,
} from "@/lib/rag/llm-settings";
import {
  missingKeyMessage,
  providerConfigured,
  resolveChatModel,
} from "@/lib/rag/provider";
import { buildSystemPrompt, formatRetrievedContext } from "@/lib/rag/prompt";
import { checkRateLimit } from "@/lib/rag/rate-limit";
import { getIndexMeta, retrieveChunks } from "@/lib/rag/retrieve";
import type { ChatCitation } from "@/lib/rag/types";
import { createClient } from "@/lib/supabase/server";

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };

type ChatBody = {
  messages?: IncomingMessage[];
  lessonId?: string | null;
  locale?: "zh-CN" | "en";
  sessionId?: string | null;
  /** Ephemeral per-request credentials from the browser — never stored. */
  credentials?: unknown;
};

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
} as const;

function clientKey(req: Request, userId: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${fwd || "anon"}`;
}

function jsonNoStore(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { ...NO_STORE, ...init?.headers },
  });
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "zh-CN";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return jsonNoStore(
      { error: locale === "en" ? "Empty message" : "消息不能为空" },
      { status: 400 },
    );
  }

  // Ephemeral user credentials — used only for this request, never written to disk/DB/logs.
  const userCreds = sanitizeUserCredentials(body.credentials);

  // Localhost endpoints must be called from the browser (see TutorChat hybrid path).
  if (userCreds && isLocalOpenAIEndpoint(userCreds.apiUrl)) {
    return jsonNoStore(
      {
        error:
          locale === "en"
            ? "Local OpenAI-compatible URLs (Ollama / LM Studio) are streamed from the browser. The UI should call /api/rag then your local /v1/chat/completions — not this proxy."
            : "本机 OpenAI 兼容地址（Ollama / LM Studio）应由浏览器直连。界面会先请求 /api/rag，再调用本机 /v1/chat/completions，请勿经此代理。",
        code: "USE_CLIENT_STREAM",
        docs: "/docs/ai-tutor",
      },
      { status: 400 },
    );
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }
  } catch {
    // OAuth incomplete must not block chat
  }

  const rl = checkRateLimit({
    key: clientKey(req, userId),
    authenticated: Boolean(userId),
  });
  if (!rl.ok) {
    return jsonNoStore(
      {
        error:
          locale === "en"
            ? "Rate limit reached. Sign in for a higher soft limit, or try again later."
            : "已达软限流上限。登录可提高额度，或稍后再试。",
        limit: rl.limit,
        resetAt: rl.resetAt,
        docs: "/docs/ai-tutor",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const resolved = resolveChatModel(userCreds);
  if (!resolved) {
    return jsonNoStore(
      {
        error: missingKeyMessage(locale),
        code: "AI_NOT_CONFIGURED",
        docs: "/docs/ai-tutor",
        supportsUserCredentials: true,
        presets: [...LLM_PRESETS],
        hint:
          locale === "en"
            ? "Open API settings and pick Ollama, DeepSeek, SiliconFlow, or any OpenAI-compatible URL. Keyword RAG still runs once generation is configured."
            : "请打开 API 设置，选择 Ollama / DeepSeek / 硅基流动或任意 OpenAI 兼容地址。配置生成能力后，本地关键词 RAG 仍会照常工作。",
      },
      { status: 503 },
    );
  }

  const retrieved = retrieveChunks({
    query: lastUser.content,
    locale,
    lessonId: body.lessonId ?? null,
    topK: 6,
  });

  const citations: ChatCitation[] = retrieved.map((c) => ({
    lesson_id: c.lesson_id,
    path: c.path,
    heading: c.heading,
    lessonHref: c.lessonHref,
    excerpt: c.content.slice(0, 180),
  }));

  const system = [
    buildSystemPrompt(locale),
    "",
    formatRetrievedContext(retrieved),
  ].join("\n");

  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const result = streamText({
      model: resolved.model,
      system,
      messages: chatMessages,
      temperature: 0.3,
    });

    return result.toTextStreamResponse({
      headers: {
        ...NO_STORE,
        "X-Citations": encodeCitationsHeader(citations),
        "X-Citations-Empty": citations.length === 0 ? "1" : "0",
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RAG-Mode": "local-keyword",
        "X-LLM-Source": resolved.config.source,
        "X-LLM-Api-Type": resolved.config.apiType,
      },
    });
  } catch (err) {
    // Do not echo request credentials or full provider payloads.
    const msg = err instanceof Error ? err.message : "LLM request failed";
    return jsonNoStore(
      {
        error: msg,
        docs: "/docs/ai-tutor",
      },
      { status: 502 },
    );
  }
}

/** Lightweight status for UI (no secrets). */
export async function GET() {
  return jsonNoStore({
    configured: providerConfigured(),
    serverConfigured: providerConfigured(),
    supportsUserCredentials: true,
    openSourceStack: true,
    apiTypes: [...LLM_API_TYPES],
    presets: [...LLM_PRESETS],
    docs: "/docs/ai-tutor",
    index: getIndexMeta(),
    note: "Prefer OpenAI-compatible presets (Ollama / DeepSeek / SiliconFlow). Localhost streams from the browser via /api/rag + direct /v1/chat/completions.",
  });
}
