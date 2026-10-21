import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 👍/👎 feedback stub.
 * Persists to chat_messages.feedback when session/message ids exist and user is logged in.
 * Otherwise acknowledges locally (no-op) so the UI can stay interactive without Auth.
 */
export async function POST(req: Request) {
  let body: {
    messageId?: number | string;
    sessionId?: string;
    vote?: 1 | -1 | "up" | "down";
    localOnly?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const vote =
    body.vote === "up" || body.vote === 1
      ? 1
      : body.vote === "down" || body.vote === -1
        ? -1
        : null;
  if (vote === null) {
    return NextResponse.json({ error: "vote must be up/down or 1/-1" }, { status: 400 });
  }

  // Always accept stub feedback so UI works offline / anonymous.
  if (body.localOnly || !body.messageId || !body.sessionId) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      vote,
      note: "Feedback recorded client-side stub; wire message ids after chat persistence is enabled.",
    });
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, persisted: false, vote });
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ ok: true, persisted: false, vote });
    }

    const id =
      typeof body.messageId === "string"
        ? Number(body.messageId)
        : body.messageId;
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: true, persisted: false, vote });
    }

    const { error } = await supabase
      .from("chat_messages")
      .update({ feedback: vote })
      .eq("id", id)
      .eq("session_id", body.sessionId);

    if (error) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        vote,
        note: error.message,
      });
    }
    return NextResponse.json({ ok: true, persisted: true, vote });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, vote });
  }
}
