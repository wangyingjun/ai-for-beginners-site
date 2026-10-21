"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function AuthButton({ locale }: { locale: Locale }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();

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
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const login = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      },
    });
    if (error) {
      setBusy(false);
      alert(error.message);
    }
  };

  const logout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  };

  if (!ready) {
    return (
      <span className="text-xs text-zinc-400">{t(locale, "authLoading")}</span>
    );
  }

  if (!configured) {
    return (
      <span
        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        title={t(locale, "authNotConfiguredHint")}
      >
        {t(locale, "authNotConfigured")}
      </span>
    );
  }

  if (user) {
    const label =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.email ||
      t(locale, "authSignedIn");
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="max-w-[8rem] truncate text-zinc-600 dark:text-zinc-300">
          {label}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={logout}
          className="rounded-md border border-zinc-300 px-2 py-0.5 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
        >
          {t(locale, "authLogout")}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={login}
      className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {t(locale, "authLoginGitHub")}
    </button>
  );
}
