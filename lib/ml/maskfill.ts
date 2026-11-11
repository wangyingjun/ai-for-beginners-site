/** Fill-in-the-blank from sentence co-occurrence, normalized like PMI: Σ co(x,c) / (f(x)·f(c)). */
export const BASE_CORPUS = [
  "早上 我 喝 咖啡 提神",
  "早上 喝 一杯 咖啡",
  "下午 喝 一杯 茶",
  "晚上 睡觉 前 喝 一杯 牛奶",
  "晚上 喝 牛奶 好 睡觉",
  "运动 后 我 喝 一杯 水",
  "口渴 了 喝 水",
  "我 喝 一杯 水",
  "小鸟 在 天上 飞",
  "飞机 在 天上 飞",
  "小鱼 在 水里 游",
  "小鸟 在 树上 唱歌",
];
export const EXTRA_SENTENCES = ["早上 我 喝 一杯 茶", "早上 我 喝 一杯 茶 很 舒服"];

export type MaskQ = { id: string; left: string[]; right: string[]; cands: string[]; answer: string };
export const MASK_QS: MaskQ[] = [
  { id: "q1", left: "早上 我 喝 一杯".split(" "), right: [], cands: ["咖啡", "茶", "牛奶", "水"], answer: "咖啡" },
  { id: "q2", left: "晚上 我 想 喝 一杯".split(" "), right: [], cands: ["咖啡", "茶", "牛奶", "水"], answer: "牛奶" },
  { id: "q3", left: [], right: "在 水里 游".split(" "), cands: ["小鸟", "小鱼", "飞机"], answer: "小鱼" },
];

export function contextWords(q: MaskQ, window: number, both: boolean): { left: Set<number>; right: Set<number> } {
  const left = new Set<number>();
  const right = new Set<number>();
  for (let i = Math.max(0, q.left.length - window); i < q.left.length; i++) left.add(i);
  if (both) for (let i = 0; i < Math.min(window, q.right.length); i++) right.add(i);
  return { left, right };
}

export function predict(corpus: string[], q: MaskQ, window: number, both: boolean): { word: string; score: number }[] {
  const S = corpus.map((s) => new Set(s.split(" ")));
  const f = (w: string) => S.reduce((n, s) => n + (s.has(w) ? 1 : 0), 0);
  const co = (x: string, c: string) => S.reduce((n, s) => n + (s.has(x) && s.has(c) ? 1 : 0), 0);
  const { left, right } = contextWords(q, window, both);
  const ctx = [...[...left].map((i) => q.left[i]), ...[...right].map((i) => q.right[i])];
  return q.cands.map((c) => ({
    word: c,
    score: ctx.reduce((s, x) => (f(x) && f(c) ? s + co(x, c) / (f(x) * f(c)) : s), 0),
  }));
}

export function top(scores: { word: string; score: number }[]): string | null {
  const best = Math.max(...scores.map((s) => s.score));
  if (best <= 0) return null;
  const winners = scores.filter((s) => Math.abs(s.score - best) < 1e-9);
  return winners.length === 1 ? winners[0].word : null;
}
