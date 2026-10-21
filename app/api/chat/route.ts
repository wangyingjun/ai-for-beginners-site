import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import {
  missingKeyMessage,
  providerConfigured,
  resolveProviderConfig,
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
};

function clientKey(req: Request, userId: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${fwd || "anon"}`;
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "zh-CN";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return NextResponse.json(
      { error: locale === "en" ? "Empty message" : "消息不能为空" },
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
    return NextResponse.json(
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

  if (!providerConfigured()) {
    return NextResponse.json(
      {
        error: missingKeyMessage(locale),
        code: "AI_NOT_CONFIGURED",
        docs: "/docs/ai-tutor",
        hint:
          locale === "en"
            ? "Scaffold is ready: local keyword retrieval works; set OPENAI_API_KEY or AI_GATEWAY_API_KEY to enable generation."
            : "脚手架已就绪：本地关键词检索可用；设置 OPENAI_API_KEY 或 AI_GATEWAY_API_KEY 后即可生成回答。",
      },
      { status: 503 },
    );
  }

  const cfg = resolveProviderConfig()!;
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

  const openai = createOpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
  });

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
      model: openai.chat(cfg.chatModel),
      system,
      messages: chatMessages,
      temperature: 0.3,
    });

    // Attach citations as a custom header (base64url JSON) for the UI.
    const citationHeader = Buffer.from(
      JSON.stringify(citations),
      "utf8",
    ).toString("base64url");

    return result.toTextStreamResponse({
      headers: {
        "X-Citations": citationHeader,
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RAG-Mode": "local-keyword",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM request failed";
    return NextResponse.json(
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
  return NextResponse.json({
    configured: providerConfigured(),
    docs: "/docs/ai-tutor",
    index: meta,
  });
}
