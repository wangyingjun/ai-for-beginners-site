/** 外卖评论 → features, for the "数据就是一堆点" micro-lesson. Label 1 = 好评 (red), 0 = 差评 (blue). */

export type Review = { text: string; label: 0 | 1 };

export const REVIEWS: Review[] = [
  { text: "好吃！送得也快", label: 1 },
  { text: "味道很香，分量足", label: 1 },
  { text: "超级好吃！！还会再点", label: 1 },
  { text: "包装很好，饭还是热的", label: 1 },
  { text: "价格实惠，好吃", label: 1 },
  { text: "喜欢这家的汤，很香很香", label: 1 },
  { text: "不贵，量足，下次还点", label: 1 },
  { text: "老板人好，送餐快，菜也热乎乎的，点赞", label: 1 },
  { text: "太难吃了", label: 0 },
  { text: "等了一个半小时，饭都凉了！", label: 0 },
  { text: "分量少，还贵", label: 0 },
  { text: "难吃！！再也不点了", label: 0 },
  { text: "菜是凉的，服务很差，打电话也没人接", label: 0 },
  { text: "不好吃，也不香", label: 0 },
  { text: "太咸了，难吃", label: 0 },
];

const GOOD = ["好吃", "香", "快", "热", "实惠", "喜欢", "足", "点赞", "很好", "人好"];
const BAD = ["难吃", "凉", "慢", "贵", "差", "少", "咸", "半小时", "没人"];

function countWords(text: string, words: string[], skipNegated: boolean): number {
  let n = 0;
  for (const w of words) {
    let i = text.indexOf(w);
    while (i !== -1) {
      const negated = i > 0 && text[i - 1] === "不";
      // "好吃" inside "不好吃" counts as bad; "贵" inside "不贵" counts as good.
      if (!(skipNegated && negated)) n += 1;
      i = text.indexOf(w, i + w.length);
    }
  }
  return n;
}

export type FeatureId = "len" | "bang" | "good" | "bad";

export const FEATURES: { id: FeatureId; name: string; help: string }[] = [
  { id: "len", name: "字数", help: "评论有多少个字" },
  { id: "bang", name: "感叹号", help: "有几个「！」" },
  { id: "good", name: "好词数", help: "好吃、香、快、热、实惠……出现几次（「不好吃」不算）" },
  { id: "bad", name: "坏词数", help: "难吃、凉、慢、差、少……出现几次（「不贵」不算，「不好吃」算）" },
];

export function features(text: string): Record<FeatureId, number> {
  const negGood = (text.match(/不(好吃|香|快|热|好)/g) ?? []).length;
  const buGui = (text.match(/不贵/g) ?? []).length;
  return {
    len: [...text.replace(/[，。！!？?、\s]/g, "")].length,
    bang: (text.match(/[！!]/g) ?? []).length,
    good: countWords(text, GOOD, true) + buGui,
    bad: countWords(text, BAD, true) + negGood,
  };
}

/** Can a straight line separate the two labels? (perceptron on standardized coords) */
export function separable(pts: { x: number; y: number; label: 0 | 1 }[]): { ok: boolean; w: [number, number, number] } {
  if (pts.length === 0) return { ok: false, w: [0, 0, 0] };
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sx = Math.sqrt(pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) / pts.length) || 1;
  const sy = Math.sqrt(pts.reduce((s, p) => s + (p.y - my) ** 2, 0) / pts.length) || 1;
  const z = pts.map((p) => ({ x: (p.x - mx) / sx, y: (p.y - my) / sy, t: p.label === 1 ? 1 : -1 }));
  let w0 = 0;
  let w1 = 0;
  let w2 = 0;
  for (let epoch = 0; epoch < 400; epoch++) {
    let errors = 0;
    for (const p of z) {
      if (p.t * (w0 + w1 * p.x + w2 * p.y) <= 0) {
        w0 += 0.1 * p.t;
        w1 += 0.1 * p.t * p.x;
        w2 += 0.1 * p.t * p.y;
        errors++;
      }
    }
    if (errors === 0) {
      // back to raw coordinates: w0' + w1'·x + w2'·y = 0
      return { ok: true, w: [w0 - (w1 * mx) / sx - (w2 * my) / sy, w1 / sx, w2 / sy] };
    }
  }
  return { ok: false, w: [0, 0, 0] };
}

/** Does one feature alone separate the labels with a threshold? */
export function axisSeparable(values: number[], labels: (0 | 1)[]): boolean {
  const pos = values.filter((_, i) => labels[i] === 1);
  const neg = values.filter((_, i) => labels[i] === 0);
  if (!pos.length || !neg.length) return false;
  return Math.max(...neg) < Math.min(...pos) || Math.max(...pos) < Math.min(...neg);
}
