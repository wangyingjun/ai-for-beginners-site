/** Hand-placed 2-D "word vectors" (zh) with exact analogy offsets, for lesson 14. */

export type WordVec = { word: string; x: number; y: number; group: string };

const add = (p: [number, number], d: [number, number]): [number, number] => [p[0] + d[0], p[1] + d[1]];
const FEMALE: [number, number] = [0.13, -0.02];
const YOUNG: [number, number] = [0.0, -0.1];
const ROYAL: [number, number] = [0.0, 0.22];
const CAPITAL: [number, number] = [0.09, -0.09];
const BABY: [number, number] = [0.0, -0.1];

const man: [number, number] = [0.08, 0.62];
const woman = add(man, FEMALE);
const king = add(man, ROYAL);
const queen = add(woman, ROYAL);
const dog: [number, number] = [0.66, 0.84];
const cat: [number, number] = [0.8, 0.88];
const tiger: [number, number] = [0.92, 0.8];
const france: [number, number] = [0.06, 0.3];
const uk: [number, number] = [0.22, 0.36];
const china: [number, number] = [0.42, 0.38];

const L: [string, [number, number], string][] = [
  ["男人", man, "人"],
  ["女人", woman, "人"],
  ["男孩", add(man, YOUNG), "人"],
  ["女孩", add(woman, YOUNG), "人"],
  ["国王", king, "人"],
  ["女王", queen, "人"],
  ["王子", add(king, YOUNG), "人"],
  ["公主", add(queen, YOUNG), "人"],
  ["狗", dog, "动物"],
  ["猫", cat, "动物"],
  ["小狗", add(dog, BABY), "动物"],
  ["小猫", add(cat, BABY), "动物"],
  ["老虎", tiger, "动物"],
  ["小老虎", add(tiger, BABY), "动物"],
  ["法国", france, "地点"],
  ["巴黎", add(france, CAPITAL), "地点"],
  ["英国", uk, "地点"],
  ["伦敦", add(uk, CAPITAL), "地点"],
  ["中国", china, "地点"],
  ["北京", add(china, CAPITAL), "地点"],
  ["苹果", [0.66, 0.32], "食物"],
  ["香蕉", [0.78, 0.26], "食物"],
  ["橙子", [0.72, 0.42], "食物"],
  ["面包", [0.6, 0.18], "食物"],
  ["米饭", [0.86, 0.14], "食物"],
];

export const WORDS: WordVec[] = L.map(([word, [x, y], group]) => ({ word, x, y, group }));

export function vec(w: string): [number, number] {
  const v = WORDS.find((x) => x.word === w);
  return v ? [v.x, v.y] : [0, 0];
}

export function neighbors(w: string, k = 3): string[] {
  const [x, y] = vec(w);
  return WORDS.filter((o) => o.word !== w)
    .map((o) => ({ o, d: (o.x - x) ** 2 + (o.y - y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((e) => e.o.word);
}

/** a − b + c → nearest word (excluding a, b, c). */
export function analogy(a: string, b: string, c: string): { word: string; point: [number, number] } {
  const [ax, ay] = vec(a);
  const [bx, by] = vec(b);
  const [cx, cy] = vec(c);
  const p: [number, number] = [ax - bx + cx, ay - by + cy];
  let best = WORDS[0].word;
  let bd = Infinity;
  for (const o of WORDS) {
    if ([a, b, c].includes(o.word)) continue;
    const d = (o.x - p[0]) ** 2 + (o.y - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = o.word;
    }
  }
  return { word: best, point: p };
}
