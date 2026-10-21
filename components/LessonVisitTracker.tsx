"use client";

import { useEffect } from "react";
import { markLessonVisited } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";

/** Marks a lesson as visited in localStorage (+ Supabase when logged in). */
export function LessonVisitTracker({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    markLessonVisited(lessonId);
    const supabase = createClient();
    if (!supabase) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          item_type: "lesson",
          item_id: lessonId,
          status: "visited",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id,item_type,item_id" },
      );
    })();
  }, [lessonId]);

  return null;
}
