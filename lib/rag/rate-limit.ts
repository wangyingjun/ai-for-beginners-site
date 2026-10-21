/**
 * Soft in-memory rate-limit stub (per serverless isolate).
 * Prefer logged-in users (higher quota). Not durable across instances — replace
 * with Upstash / Supabase counters in production.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ANON_LIMIT = 10;
const AUTH_LIMIT = 60;

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(opts: {
  key: string;
  authenticated: boolean;
}): RateLimitResult {
  const limit = opts.authenticated ? AUTH_LIMIT : ANON_LIMIT;
  const now = Date.now();
  let b = buckets.get(opts.key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(opts.key, b);
  }
  if (b.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - b.count),
    resetAt: b.resetAt,
  };
}
