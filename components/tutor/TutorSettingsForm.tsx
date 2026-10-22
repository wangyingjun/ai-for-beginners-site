"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  API_TYPE_LABELS,
  DEFAULT_API_URL,
  DEFAULT_CHAT_MODEL,
  LLM_API_TYPES,
  LLM_PRESETS,
  PRESET_DEFS,
  applyPreset,
  isLocalOpenAIEndpoint,
  type LlmApiType,
  type LlmPreset,
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
  const [preset, setPreset] = useState<LlmPreset>("ollama");
  const [apiType, setApiType] = useState<LlmApiType>("openai-compatible");
  const [apiUrl, setApiUrl] = useState(PRESET_DEFS.ollama.apiUrl);
  const [apiKey, setApiKey] = useState("");
  const [chatModel, setChatModel] = useState(PRESET_DEFS.ollama.chatModel);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadUserLlmSettings();
    if (existing) {
      setApiType(existing.apiType);
      setApiUrl(existing.apiUrl);
      setApiKey(
        existing.apiKey === "ollama" || existing.apiKey === "no-key"
          ? ""
          : existing.apiKey,
      );
      setChatModel(
        existing.chatModel || DEFAULT_CHAT_MODEL[existing.apiType],
      );
      setPreset(existing.preset ?? "custom");
    }
  }, []);

  function onPresetChange(next: LlmPreset) {
    setPreset(next);
    const def = PRESET_DEFS[next];
    setApiType(def.apiType);
    setApiUrl(def.apiUrl);
    setChatModel(def.chatModel);
    if (def.keyOptional) setApiKey("");
  }

  function onTypeChange(next: LlmApiType) {
    setApiType(next);
    setPreset("custom");
    const prevDefaults = [
      ...Object.values(DEFAULT_API_URL),
      ...Object.values(PRESET_DEFS).map((d) => d.apiUrl),
    ];
    if (!apiUrl.trim() || prevDefaults.includes(apiUrl)) {
      setApiUrl(DEFAULT_API_URL[next]);
    }
    const prevModels = [
      ...Object.values(DEFAULT_CHAT_MODEL),
      ...Object.values(PRESET_DEFS).map((d) => d.chatModel),
    ];
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
        preset,
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
    const fresh = applyPreset("ollama");
    setPreset("ollama");
    setApiKey("");
    setApiType(fresh.apiType);
    setApiUrl(fresh.apiUrl);
    setChatModel(fresh.chatModel || PRESET_DEFS.ollama.chatModel);
    setSaved(false);
    setError(null);
    onChange?.(null);
  }

  const keyOptional =
    PRESET_DEFS[preset]?.keyOptional ||
    (apiType === "openai-compatible" && isLocalOpenAIEndpoint(apiUrl));
  const presetHint = PRESET_DEFS[preset]?.hint[locale];

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
        {t(locale, "tutorPreset")}
        <select
          className={fieldClass}
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as LlmPreset)}
        >
          {LLM_PRESETS.map((id) => (
            <option key={id} value={id}>
              {PRESET_DEFS[id].label[locale]}
            </option>
          ))}
        </select>
      </label>

      {presetHint && (
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          {presetHint}
        </p>
      )}

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
          onChange={(e) => {
            setApiUrl(e.target.value);
            setPreset("custom");
          }}
          placeholder={DEFAULT_API_URL[apiType]}
          autoComplete="off"
          required
        />
      </label>

      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t(locale, "tutorApiKey")}
        {keyOptional ? (
          <span className="ml-1 font-normal text-zinc-400">
            ({t(locale, "tutorApiKeyOptional")})
          </span>
        ) : null}
        <input
          type="password"
          className={fieldClass}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={keyOptional ? "ollama / 可留空" : "sk-…"}
          autoComplete="off"
          required={!keyOptional}
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
