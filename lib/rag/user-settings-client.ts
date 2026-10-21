"use client";

/**
 * Browser-only persistence for per-user LLM credentials.
 * Keys stay in localStorage — never sent to Supabase or written to disk/DB.
 */

import {
  LLM_SETTINGS_STORAGE_KEY,
  sanitizeUserCredentials,
  type UserLlmSettings,
} from "./llm-settings";

export function loadUserLlmSettings(): UserLlmSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LLM_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeUserCredentials(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveUserLlmSettings(settings: UserLlmSettings): void {
  if (typeof window === "undefined") return;
  const clean = sanitizeUserCredentials(settings);
  if (!clean) {
    throw new Error("Incomplete LLM settings");
  }
  window.localStorage.setItem(LLM_SETTINGS_STORAGE_KEY, JSON.stringify(clean));
}

export function clearUserLlmSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LLM_SETTINGS_STORAGE_KEY);
}
