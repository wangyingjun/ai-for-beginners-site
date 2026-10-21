/**
 * Tiny attention toy for lesson 18 — no real transformer weights.
 * Builds a soft attention matrix from token embedding similarity + optional query focus.
 */

export function tokenizeSentence(s: string): string[] {
  return s
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[.,!?;:"()]/g, ""))
    .filter(Boolean);
}

/** Deterministic pseudo-embedding from character codes (dim=8). */
function embed(token: string): number[] {
  const v = new Array(8).fill(0);
  const t = token.toLowerCase();
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    v[i % 8] += (c % 31) / 31;
    v[(i * 3) % 8] += (c % 17) / 40;
  }
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

function dot(a: number[], b: number[]) {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

function softmax(xs: number[], temperature = 1): number[] {
  const t = Math.max(0.05, temperature);
  const scaled = xs.map((x) => x / t);
  const m = Math.max(...scaled);
  const exps = scaled.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Self-attention weights [query][key]. */
export function selfAttentionMatrix(
  tokens: string[],
  temperature = 0.4,
): number[][] {
  const E = tokens.map(embed);
  return E.map((q) => {
    const scores = E.map((k) => dot(q, k));
    return softmax(scores, temperature);
  });
}

/** Color helper: weight 0..1 → indigo heatmap. */
export function heatColor(w: number): string {
  const x = Math.max(0, Math.min(1, w));
  const r = Math.round(238 - x * 120);
  const g = Math.round(242 - x * 160);
  const b = Math.round(255 - x * 40);
  return `rgb(${r},${g},${b})`;
}
