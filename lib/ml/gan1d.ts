/** 1-D "GAN" toy: densities on 40 bins over [0,10]; the best possible judge's accuracy = ½ + ½·TV. */
export const BINS = 40;
const xs = Array.from({ length: BINS }, (_, i) => ((i + 0.5) * 10) / BINS);
const gauss = (mu: number, sd: number) => {
  const d = xs.map((x) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)));
  const s = d.reduce((a, b) => a + b, 0) || 1;
  return d.map((v) => v / s);
};
export type GenParams = { mu1: number; sd1: number; mu2: number; sd2: number; two: boolean };
export function genDensity(p: GenParams): number[] {
  const a = gauss(p.mu1, p.sd1);
  if (!p.two) return a;
  const b = gauss(p.mu2, p.sd2);
  return a.map((v, i) => 0.5 * v + 0.5 * b[i]);
}
export const REAL = {
  one: gauss(6.5, 0.9),
  two: (() => {
    const a = gauss(2.5, 0.7);
    const b = gauss(7.5, 0.7);
    return a.map((v, i) => 0.5 * v + 0.5 * b[i]);
  })(),
};
export function judgeAcc(real: number[], fake: number[]): number {
  let tv = 0;
  for (let i = 0; i < BINS; i++) tv += Math.abs(real[i] - fake[i]);
  return 0.5 + 0.25 * tv;
}
/** Per-bin judge verdict: how "real" a sample landing here looks (0..1). */
export const judgeCurve = (real: number[], fake: number[]) => real.map((r, i) => (r + fake[i] < 1e-6 ? 0.5 : r / (r + fake[i])));

/** One generator update: try small nudges to each parameter, keep the one that fools the judge most. */
export function genStep(real: number[], p: GenParams): GenParams {
  const keys: (keyof GenParams)[] = p.two ? ["mu1", "sd1", "mu2", "sd2"] : ["mu1", "sd1"];
  let best = p;
  let bestAcc = judgeAcc(real, genDensity(p));
  for (const k of keys)
    for (const d of [-0.3, 0.3, -0.1, 0.1]) {
      const q = { ...p, [k]: (p[k] as number) + d } as GenParams;
      if (q.sd1 < 0.3 || q.sd2 < 0.3 || q.sd1 > 4 || q.sd2 > 4) continue;
      const a = judgeAcc(real, genDensity(q));
      if (a < bestAcc - 1e-9) { best = q; bestAcc = a; }
    }
  return best;
}
