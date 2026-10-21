/** Client-safe helpers for teacher classes (no secrets). */

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type ClassMemberRow = {
  class_id: string;
  user_id: string;
  joined_at: string;
};

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += INVITE_ALPHABET[bytes[i]! % INVITE_ALPHABET.length];
  }
  return out;
}

export function scoreToHeatColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) {
    return "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600";
  }
  const s = Math.max(0, Math.min(1, score));
  if (s >= 0.85) return "bg-emerald-500 text-white";
  if (s >= 0.7) return "bg-emerald-300 text-emerald-950 dark:bg-emerald-700 dark:text-white";
  if (s >= 0.5) return "bg-amber-300 text-amber-950 dark:bg-amber-700 dark:text-white";
  if (s > 0) return "bg-rose-300 text-rose-950 dark:bg-rose-800 dark:text-white";
  return "bg-rose-500 text-white";
}

export function formatScorePct(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "—";
  return `${Math.round(score * 100)}%`;
}
