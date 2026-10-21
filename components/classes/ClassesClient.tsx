"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { generateInviteCode, type ClassRow } from "@/lib/classes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type TeachingClass = ClassRow & { member_count?: number };
type MemberClass = { id: string; name: string; invite_code: string; teacher_id: string };

export function ClassesClient({ locale }: { locale: Locale }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [teaching, setTeaching] = useState<TeachingClass[]>([]);
  const [memberOf, setMemberOf] = useState<MemberClass[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);

  const reload = useCallback(async (u: User) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: mine, error: e1 } = await supabase
      .from("classes")
      .select("id,teacher_id,name,invite_code,created_at")
      .eq("teacher_id", u.id)
      .order("created_at", { ascending: false });
    if (e1) {
      setError(e1.message);
      return;
    }
    const teachingRows = (mine ?? []) as TeachingClass[];
    for (const row of teachingRows) {
      const { count } = await supabase
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("class_id", row.id);
      row.member_count = count ?? 0;
    }
    setTeaching(teachingRows);

    const { data: memberships, error: e2 } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", u.id);
    if (e2) {
      setError(e2.message);
      return;
    }
    const ids = (memberships ?? []).map((m) => m.class_id as string);
    if (ids.length === 0) {
      setMemberOf([]);
      return;
    }
    const { data: joined, error: e3 } = await supabase
      .from("classes")
      .select("id,name,invite_code,teacher_id")
      .in("id", ids);
    if (e3) {
      setError(e3.message);
      return;
    }
    setMemberOf((joined ?? []) as MemberClass[]);
  }, []);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    void (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u);
      if (u) await reload(u);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void reload(u);
      else {
        setTeaching([]);
        setMemberOf([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, reload]);

  const createClass = async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t(locale, "classesNameRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    setCreatedInvite(null);
    let invite = generateInviteCode();
    let inserted: ClassRow | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error: err } = await supabase
        .from("classes")
        .insert({
          teacher_id: user.id,
          name: trimmed,
          invite_code: invite,
        })
        .select("id,teacher_id,name,invite_code,created_at")
        .single();
      if (!err && data) {
        inserted = data as ClassRow;
        break;
      }
      if (err?.code === "23505") {
        invite = generateInviteCode();
        continue;
      }
      setError(err?.message ?? t(locale, "classesCreateFailed"));
      setBusy(false);
      return;
    }
    if (!inserted) {
      setError(t(locale, "classesCreateFailed"));
      setBusy(false);
      return;
    }
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          role: "teacher",
          display_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.user_name ||
            user.email ||
            null,
        },
        { onConflict: "id" },
      );
    setCreatedInvite(inserted.invite_code);
    setName("");
    await reload(user);
    setBusy(false);
  };

  if (!ready) {
    return <p className="text-sm text-zinc-500">{t(locale, "authLoading")}</p>;
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">{t(locale, "classesNeedLogin")}</p>
        <p className="mt-2">{t(locale, "classesNeedLoginHint")}</p>
        <Link
          href={`/docs/auth?lang=${locale}`}
          className="mt-3 inline-block text-indigo-700 underline dark:text-indigo-300"
        >
          docs/auth.md
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">{t(locale, "classesNeedLogin")}</p>
        <p className="mt-2">{t(locale, "classesNeedLoginHint")}</p>
        <p className="mt-2 text-xs opacity-80">{t(locale, "authNotConfiguredHint")}</p>
        <Link
          href={`/docs/auth?lang=${locale}`}
          className="mt-3 inline-block text-indigo-700 underline dark:text-indigo-300"
        >
          docs/auth.md
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{t(locale, "classesCreateTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t(locale, "classesCreateHint")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(locale, "classesNamePlaceholder")}
            className="min-w-[14rem] flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void createClass()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t(locale, "classesCreate")}
          </button>
        </div>
        {createdInvite && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
            {t(locale, "classesInviteReady")}:{" "}
            <code className="font-mono font-semibold tracking-wider">{createdInvite}</code>
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {t(locale, "classesTeaching")} ({teaching.length})
          </h2>
          <Link
            href={`/join?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "classesJoinLink")} →
          </Link>
        </div>
        {teaching.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesEmptyTeaching")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {teaching.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div>
                  <Link
                    href={`/classes/${c.id}?lang=${locale}`}
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {t(locale, "classesInviteCode")}:{" "}
                    <code className="font-mono tracking-wider">{c.invite_code}</code>
                    {" · "}
                    {t(locale, "classesMembers")}: {c.member_count ?? 0}
                  </p>
                </div>
                <Link
                  href={`/classes/${c.id}?lang=${locale}`}
                  className="text-xs text-zinc-600 hover:underline dark:text-zinc-300"
                >
                  {t(locale, "classesOpenDashboard")} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(locale, "classesJoined")} ({memberOf.length})
        </h2>
        {memberOf.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t(locale, "classesEmptyJoined")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {memberOf.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                {c.teacher_id === user.id ? (
                  <Link
                    href={`/classes/${c.id}?lang=${locale}`}
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {c.name}
                  </Link>
                ) : (
                  <span className="font-medium">{c.name}</span>
                )}
                <p className="text-xs text-zinc-500">
                  {c.teacher_id === user.id
                    ? t(locale, "classesYouAreTeacher")
                    : t(locale, "classesYouAreMember")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
