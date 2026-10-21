/** Classic binary perceptron (labels ±1). Pure TypeScript, no deps. */

export type Point2D = { x: number; y: number; label: 1 | -1 };

export type PerceptronState = {
  /** w0 = bias, w1 = weight for x, w2 = weight for y */
  weights: [number, number, number];
  epoch: number;
  step: number;
  lastError: number | null;
};

export function createPerceptron(seed = 1): PerceptronState {
  const rnd = mulberry32(seed);
  return {
    weights: [rnd() * 0.2 - 0.1, rnd() * 0.2 - 0.1, rnd() * 0.2 - 0.1],
    epoch: 0,
    step: 0,
    lastError: null,
  };
}

/** Predict class: +1 if w·[1,x,y] ≥ 0 else −1 */
export function predict(weights: [number, number, number], x: number, y: number): 1 | -1 {
  const z = weights[0] + weights[1] * x + weights[2] * y;
  return z >= 0 ? 1 : -1;
}

/** One sample update. Returns whether the sample was misclassified. */
export function trainStep(
  state: PerceptronState,
  point: Point2D,
  learningRate: number,
): { state: PerceptronState; updated: boolean } {
  const pred = predict(state.weights, point.x, point.y);
  const error = point.label - pred; // 0, ±2, or −2
  if (error === 0) {
    return {
      state: { ...state, step: state.step + 1, lastError: 0 },
      updated: false,
    };
  }
  const eta = learningRate;
  const w: [number, number, number] = [
    state.weights[0] + eta * point.label * 1,
    state.weights[1] + eta * point.label * point.x,
    state.weights[2] + eta * point.label * point.y,
  ];
  return {
    state: {
      weights: w,
      epoch: state.epoch,
      step: state.step + 1,
      lastError: error,
    },
    updated: true,
  };
}

/** One full pass over points (in order). Returns count of updates. */
export function trainEpoch(
  state: PerceptronState,
  points: Point2D[],
  learningRate: number,
): { state: PerceptronState; updates: number } {
  let s = state;
  let updates = 0;
  for (const p of points) {
    const r = trainStep(s, p, learningRate);
    s = r.state;
    if (r.updated) updates += 1;
  }
  return {
    state: { ...s, epoch: s.epoch + 1 },
    updates,
  };
}

/** Accuracy in [0,1]. Empty set → 1. */
export function accuracy(weights: [number, number, number], points: Point2D[]): number {
  if (!points.length) return 1;
  let ok = 0;
  for (const p of points) {
    if (predict(weights, p.x, p.y) === p.label) ok += 1;
  }
  return ok / points.length;
}

/**
 * Decision boundary line in data space for w0 + w1 x + w2 y = 0.
 * Returns two endpoints clipped to [min,max]², or null if nearly vertical/horizontal degenerate.
 */
export function decisionBoundaryLine(
  weights: [number, number, number],
  min = -1.2,
  max = 1.2,
): [[number, number], [number, number]] | null {
  const [b, wx, wy] = weights;
  const pts: [number, number][] = [];

  // Intersect with box edges
  if (Math.abs(wy) > 1e-9) {
    for (const x of [min, max]) {
      const y = -(b + wx * x) / wy;
      if (y >= min - 1e-9 && y <= max + 1e-9) pts.push([x, clamp(y, min, max)]);
    }
  }
  if (Math.abs(wx) > 1e-9) {
    for (const y of [min, max]) {
      const x = -(b + wy * y) / wx;
      if (x >= min - 1e-9 && x <= max + 1e-9) pts.push([clamp(x, min, max), y]);
    }
  }

  // Deduplicate
  const uniq: [number, number][] = [];
  for (const p of pts) {
    if (!uniq.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6)) {
      uniq.push(p);
    }
  }
  if (uniq.length < 2) return null;
  return [uniq[0], uniq[1]];
}

export function seedLinearlySeparable(n = 24, seed = 42): Point2D[] {
  const rnd = mulberry32(seed);
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    // True boundary: x + y > 0
    const label: 1 | -1 = x + y > 0.05 ? 1 : x + y < -0.05 ? -1 : rnd() > 0.5 ? 1 : -1;
    points.push({ x, y, label });
  }
  return points;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Deterministic PRNG */
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
