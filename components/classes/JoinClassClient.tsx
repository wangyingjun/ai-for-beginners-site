"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function JoinClassClient({
  locale,
  initialCode,
}: {
  locale: Locale;
  initialCode?: string;
}) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState(initialCode?.trim().toUpperCase() ?? "");
  const [preview, setPreview] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

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
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [configured]);

  useEffect(() => {
    if (!configured || !user || !code.trim()) {
      setPreview(null);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const { data, error: err } = await supabase.rpc("lookup_class_by_invite", {
          invite: code.trim(),
        });
        if (cancelled) return;
        if (err) {
          setPreview(null);
          return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.id && row?.name) {
          setPreview({ id: row.id as string, name: row.name as string });
        } else {
          setPreview(null);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, configured, user]);

  const join = async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const invite = code.trim();
    if (!invite) {
      setError(t(locale, "classesInviteRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    setOk(false);
    const { data, error: err } = await supabase.rpc("join_class_by_invite", {
      invite,
    });
    if (err) {
      setError(
        err.message.includes("invalid invite")
          ? t(locale, "classesInvalidInvite")
          : err.message,
      );
      setBusy(false);
      return;
    }
    const classId = (data as string) || preview?.id;
    setOk(true);
    setBusy(false);
    if (classId) {
      router.push(`/classes/${classId}?lang=${locale}`);
    }
  };

  if (!ready) {
    return <p className="text-sm text-zinc-500">{t(locale, "authLoading")}</p>;
  }

  if (!configured || !user) {
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="block text-sm font-medium" htmlFor="invite-code">
          {t(locale, "classesInviteCode")}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="invite-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="min-w-[10rem] flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono tracking-widest text-sm uppercase dark:border-zinc-700 dark:bg-zinc-950"
            autoComplete="off"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void join()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t(locale, "classesJoin")}
          </button>
        </div>
        {preview && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            {t(locale, "classesJoinPreview")}:{" "}
            <span className="font-semibold">{preview.name}</span>
          </p>
        )}
        {ok && (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
            {t(locale, "classesJoinSuccess")}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </section>
      <p>
        <Link
          href={`/classes?lang=${locale}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {t(locale, "classesBack")}
        </Link>
      </p>
    </div>
  );
}
