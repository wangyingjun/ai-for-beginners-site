"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  API_TYPE_LABELS,
  DEFAULT_API_URL,
  DEFAULT_CHAT_MODEL,
  LLM_API_TYPES,
  type LlmApiType,
  type UserLlmSettings,
} from "@/lib/rag/llm-settings";
import {
  clearUserLlmSettings,
  loadUserLlmSettings,
  saveUserLlmSettings,
} from "@/lib/rag/user-settings-client";

type Props = {
  locale: Locale;
  /** Called after save or clear so parent can refresh readiness. */
  onChange?: (settings: UserLlmSettings | null) => void;
  /** Compact layout inside the floating panel */
  compact?: boolean;
};

export function TutorSettingsForm({ locale, onChange, compact }: Props) {
  const [apiType, setApiType] = useState<LlmApiType>("openai-compatible");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL["openai-compatible"]);
  const [apiKey, setApiKey] = useState("");
  const [chatModel, setChatModel] = useState(
    DEFAULT_CHAT_MODEL["openai-compatible"],
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadUserLlmSettings();
    if (existing) {
      setApiType(existing.apiType);
      setApiUrl(existing.apiUrl);
      setApiKey(existing.apiKey);
      setChatModel(
        existing.chatModel || DEFAULT_CHAT_MODEL[existing.apiType],
      );
    }
  }, []);

  function onTypeChange(next: LlmApiType) {
    setApiType(next);
    // Only auto-fill defaults when the URL still looks like a previous default.
    const prevDefaults = Object.values(DEFAULT_API_URL);
    if (!apiUrl.trim() || prevDefaults.includes(apiUrl)) {
      setApiUrl(DEFAULT_API_URL[next]);
    }
    const prevModels = Object.values(DEFAULT_CHAT_MODEL);
    if (!chatModel.trim() || prevModels.includes(chatModel)) {
      setChatModel(DEFAULT_CHAT_MODEL[next]);
    }
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const settings: UserLlmSettings = {
        apiType,
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        chatModel: chatModel.trim() || undefined,
      };
      saveUserLlmSettings(settings);
      setSaved(true);
      onChange?.(settings);
    } catch {
      setError(t(locale, "tutorSettingsInvalid"));
    }
  }

  function handleClear() {
    clearUserLlmSettings();
    setApiKey("");
    setApiType("openai-compatible");
    setApiUrl(DEFAULT_API_URL["openai-compatible"]);
    setChatModel(DEFAULT_CHAT_MODEL["openai-compatible"]);
    setSaved(false);
    setError(null);
    onChange?.(null);
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form
      onSubmit={handleSave}
      className={
        compact
          ? "space-y-2 border-t border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30"
          : "space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
      }
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "tutorSettingsTitle")}
        </h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {t(locale, "tutorSettingsHint")}
        </p>
      </div>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t(locale, "tutorApiType")}
        <select
          className={fieldClass}
          value={apiType}
          onChange={(e) => onTypeChange(e.target.value as LlmApiType)}
        >
          {LLM_API_TYPES.map((type) => (
            <option key={type} value={type}>
              {API_TYPE_LABELS[type][locale]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t(locale, "tutorApiUrl")}
        <input
          type="url"
          className={fieldClass}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder={DEFAULT_API_URL[apiType]}
          autoComplete="off"
          required
        />
      </label>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t(locale, "tutorApiKey")}
        <input
          type="password"
          className={fieldClass}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-…"
          autoComplete="off"
          required
        />
      </label>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t(locale, "tutorChatModel")}
        <input
          type="text"
          className={fieldClass}
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
          placeholder={DEFAULT_CHAT_MODEL[apiType]}
          autoComplete="off"
        />
      </label>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
      {saved && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          {t(locale, "tutorSettingsSaved")}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          {t(locale, "tutorSettingsSave")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t(locale, "tutorSettingsClear")}
        </button>
      </div>
    </form>
  );
}
