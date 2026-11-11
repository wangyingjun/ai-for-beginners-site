/** Guided-experiment datasets for the perceptron (labels ±1, data range ≈ [-1.2, 1.2]). */
import { mulberry32, type Point2D } from "@/lib/ml/perceptron";

export type PerceptronPresetId = "two-clusters" | "xor";

export const PERCEPTRON_PRESET_LABELS: Record<PerceptronPresetId, string> = {
  "two-clusters": "两团点",
  xor: "四角棋盘",
};

/** Deliberately tilted start: ~14 of 24 points begin on the wrong side. */
export const TILTED_START: [number, number, number] = [0.3, -0.8, 0.6];

/** 12 red (+1) upper-right, 12 blue (−1) lower-left, with a clear gap. */
export function twoClusters(seed = 7): Point2D[] {
  const rnd = mulberry32(seed);
  const pts: Point2D[] = [];
  const groups: [1 | -1, number, number][] = [
    [1, 0.5, 0.45],
    [-1, -0.45, -0.5],
  ];
  for (const [label, cx, cy] of groups) {
    let n = 0;
    while (n < 12) {
      const ang = rnd() * Math.PI * 2;
      const rad = 0.38 * Math.sqrt(rnd());
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);
      if (label * (x + y) < 0.25) continue; // keep a visible gap
      pts.push({ x, y, label });
      n += 1;
    }
  }
  return pts;
}

/** Checkerboard: same colour on diagonal corners — not linearly separable. */
export function xorCheckerboard(seed = 11): Point2D[] {
  const rnd = mulberry32(seed);
  const pts: Point2D[] = [];
  const corners: [1 | -1, number, number][] = [
    [1, 0.6, 0.6],
    [1, -0.6, -0.6],
    [-1, 0.6, -0.6],
    [-1, -0.6, 0.6],
  ];
  for (const [label, cx, cy] of corners) {
    for (let i = 0; i < 5; i++) {
      pts.push({
        x: cx + (rnd() - 0.5) * 0.4,
        y: cy + (rnd() - 0.5) * 0.4,
        label,
      });
    }
  }
  return pts;
}

export function perceptronPreset(id: PerceptronPresetId): Point2D[] {
  return id === "xor" ? xorCheckerboard() : twoClusters();
}

/** A point placed deep inside the other class's cluster (only meaningful for two-clusters). */
export function isOutlier(p: Point2D): boolean {
  return p.label * (p.x + p.y) < -0.2;
}
