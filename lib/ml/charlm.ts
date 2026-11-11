/** Character n-gram "language model" trained on a tiny Chinese corpus (lesson 17). */

export const CORPUS = [
  "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
  "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
  "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
  "红豆生南国，春来发几枝。愿君多采撷，此物最相思。",
  "千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。",
  "空山不见人，但闻人语响。返景入深林，复照青苔上。",
  "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。",
  "春风又绿江南岸，明月何时照我还。",
  "海上生明月，天涯共此时。",
  "日出江花红胜火，春来江水绿如蓝。",
].join("");

type Counts = Map<string, Map<string, number>>;

function build(order: 1 | 2): Counts {
  const m: Counts = new Map();
  for (let i = order; i < CORPUS.length; i++) {
    const ctx = CORPUS.slice(i - order, i);
    const next = CORPUS[i];
    if (!m.has(ctx)) m.set(ctx, new Map());
    const row = m.get(ctx)!;
    row.set(next, (row.get(next) ?? 0) + 1);
  }
  return m;
}

const BI = build(1);
const TRI = build(2);

export type Candidate = { ch: string; p: number };

/** Next-char distribution with temperature; falls back to order 1 if the 2-char context is unseen. */
export function nextDist(text: string, order: 1 | 2, temperature: number): Candidate[] {
  let row: Map<string, number> | undefined;
  if (order === 2 && text.length >= 2) row = TRI.get(text.slice(-2));
  if (!row) row = BI.get(text.slice(-1));
  if (!row) row = BI.get("。")!;
  const entries = [...row.entries()];
  const t = Math.max(0.05, temperature);
  const weights = entries.map(([, c]) => Math.pow(c, 1 / t));
  const sum = weights.reduce((a, b) => a + b, 0);
  return entries.map(([ch], i) => ({ ch, p: weights[i] / sum })).sort((a, b) => b.p - a.p);
}

export function sample(dist: Candidate[], r = Math.random()): string {
  let acc = 0;
  for (const d of dist) {
    acc += d.p;
    if (r <= acc) return d.ch;
  }
  return dist[dist.length - 1].ch;
}

export const STARTERS = ["春", "明", "白", "山", "江", "月"];
