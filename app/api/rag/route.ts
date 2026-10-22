import { NextResponse } from "next/server";
import { buildSystemPrompt, formatRetrievedContext } from "@/lib/rag/prompt";
import { checkRateLimit } from "@/lib/rag/rate-limit";
import { getIndexMeta, retrieveChunks } from "@/lib/rag/retrieve";
import type { ChatCitation } from "@/lib/rag/types";
import { createClient } from "@/lib/supabase/server";

type RagBody = {
  query?: string;
  lessonId?: string | null;
  locale?: "zh-CN" | "en";
  topK?: number;
};

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
} as const;

function clientKey(req: Request, userId: string | null): string {
  if (userId) return `rag:u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `rag:ip:${fwd || "anon"}`;
}

/**
 * Keyword RAG prepare endpoint (no LLM).
 * Browser uses this before client-side Ollama/LM Studio streaming,
 * or for debugging retrieval independently of generation.
 */
export async function POST(req: Request) {
  let body: RagBody;
  try {
    body = (await req.json()) as RagBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: NO_STORE },
    );
  }

  const locale = body.locale === "en" ? "en" : "zh-CN";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: locale === "en" ? "Empty query" : "查询不能为空" },
      { status: 400, headers: NO_STORE },
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
    /* auth optional */
  }

  // Soft limit on prepare calls (higher than chat — local Ollama still hits this)
  const rl = checkRateLimit({
    key: clientKey(req, userId),
    authenticated: Boolean(userId),
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Rate limit reached. Try again later."
            : "已达软限流上限，请稍后再试。",
        limit: rl.limit,
        resetAt: rl.resetAt,
      },
      { status: 429, headers: NO_STORE },
    );
  }

  const retrieved = retrieveChunks({
    query,
    locale,
    lessonId: body.lessonId ?? null,
    topK: body.topK ?? 6,
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

  return NextResponse.json(
    {
      mode: "local-keyword",
      empty: citations.length === 0,
      citations,
      system,
      index: getIndexMeta(),
    },
    {
      headers: {
        ...NO_STORE,
        "X-RAG-Mode": "local-keyword",
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      docs: "/docs/ai-tutor",
      mode: "local-keyword",
      index: getIndexMeta(),
      note: "POST { query, lessonId?, locale?, topK? } → citations + system prompt (no LLM).",
    },
    { headers: NO_STORE },
  );
}
