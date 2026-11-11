/** Polynomial least-squares on a toy curve, for the over-fitting lesson. */

import { mulberry32 } from "./perceptron";

export type XY = { x: number; y: number };

export const trueCurve = (x: number) => Math.sin(Math.PI * x) * 0.8;

export function makeSamples(n: number, seed: number, noise = 0.22): XY[] {
  const rnd = mulberry32(seed);
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const x = -0.95 + (1.9 * (i + 0.2 + rnd() * 0.6)) / n;
    const g = (rnd() + rnd() + rnd() - 1.5) * 2 * noise;
    out.push({ x, y: trueCurve(x) + g });
  }
  return out;
}

/** Fit coefficients c0..cd (tiny ridge for stability). */
export function polyFit(data: XY[], degree: number, ridge = 1e-9): number[] {
  const d = degree + 1;
  const A = Array.from({ length: d }, () => new Array<number>(d + 1).fill(0));
  for (const p of data) {
    const pw = Array.from({ length: d }, (_, k) => p.x ** k);
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) A[i][j] += pw[i] * pw[j];
      A[i][d] += pw[i] * p.y;
    }
  }
  for (let i = 0; i < d; i++) A[i][i] += ridge;
  for (let c = 0; c < d; c++) {
    let piv = c;
    for (let r = c + 1; r < d; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    const v = A[c][c] || 1e-12;
    for (let r = 0; r < d; r++) {
      if (r === c) continue;
      const f = A[r][c] / v;
      for (let k = c; k <= d; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[d] / (row[i] || 1e-12));
}

export const polyEval = (c: number[], x: number) => c.reduce((s, ck, k) => s + ck * x ** k, 0);

export function polyMse(c: number[], data: XY[]): number {
  return data.reduce((s, p) => s + (polyEval(c, p.x) - p.y) ** 2, 0) / data.length;
}
