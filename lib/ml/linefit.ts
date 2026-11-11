/** Toy 1-D regression data + helpers for the "loss" and "gd" micro-lessons. */

export type Pt = { x: number; y: number };

const NOISE = [0.6, -0.8, 0.3, 0.9, -0.5, -0.9, 0.7, -0.2, 0.4];

/** 9 points around y = 0.7x + 1.5 on x ∈ [1, 9]. */
export const LINE_POINTS: Pt[] = NOISE.map((n, i) => ({ x: i + 1, y: 0.7 * (i + 1) + 1.5 + n }));

export const OUTLIER: Pt = { x: 8.5, y: 0.8 };

/** Mean squared error of y = a·x + b. */
export function mse(points: Pt[], a: number, b: number): number {
  let s = 0;
  for (const p of points) {
    const e = a * p.x + b - p.y;
    s += e * e;
  }
  return s / points.length;
}

/** Least-squares best line. */
export function bestLine(points: Pt[]): { a: number; b: number; loss: number } {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const a = sxy / sxx;
  const b = my - a * mx;
  return { a, b, loss: mse(points, a, b) };
}
