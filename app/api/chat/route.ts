import { streamText } from "ai";
import { NextResponse } from "next/server";
import { LLM_API_TYPES, sanitizeUserCredentials } from "@/lib/rag/llm-settings";
import {
  missingKeyMessage,
  providerConfigured,
  resolveChatModel,
} from "@/lib/rag/provider";
import { buildSystemPrompt, formatRetrievedContext } from "@/lib/rag/prompt";
import { checkRateLimit } from "@/lib/rag/rate-limit";
import { retrieveChunks } from "@/lib/rag/retrieve";
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
        hint:
          locale === "en"
            ? "Open the setup form in the assistant UI and enter API URL, type, and key (stored in this browser only). Keyword retrieval still works once generation is configured."
            : "请在助教界面的设置表单填写 API URL、类型与 Key（仅保存在本浏览器）。配置生成能力后，本地关键词检索仍会照常工作。",
      },
      { status: 503 },
    );
  }

  // Local keyword retrieval always runs when generating (no key → no generation, retrieval unused).
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

    const citationHeader = Buffer.from(
      JSON.stringify(citations),
      "utf8",
    ).toString("base64url");

    return result.toTextStreamResponse({
      headers: {
        ...NO_STORE,
        "X-Citations": citationHeader,
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
  const meta = await import("@/lib/rag/retrieve").then((m) => m.getIndexMeta());
  return jsonNoStore({
    configured: providerConfigured(),
    serverConfigured: providerConfigured(),
    supportsUserCredentials: true,
    apiTypes: [...LLM_API_TYPES],
    docs: "/docs/ai-tutor",
    index: meta,
  });
}
