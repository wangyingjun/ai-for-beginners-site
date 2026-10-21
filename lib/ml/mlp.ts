/**
 * Tiny multilayer perceptron for 2D binary classification.
 * Inspired by TensorFlow Playground (Apache-2.0) — original implementation, no copied code.
 * https://github.com/tensorflow/playground
 */

import { mulberry32 } from "./perceptron";
import type { Sample2D } from "./datasets";

export type ActivationName = "tanh" | "relu" | "sigmoid";

export type MlpConfig = {
  /** Hidden layer sizes, e.g. [4, 2]. Input=2, output=1 (sigmoid). */
  hidden: number[];
  activation: ActivationName;
  learningRate: number;
  /** L2 regularization coefficient (λ). */
  l2: number;
};

export type DenseLayer = {
  /** rows = out, cols = in; row-major */
  W: number[];
  b: number[];
  inSize: number;
  outSize: number;
};

export type MlpModel = {
  layers: DenseLayer[];
  activation: ActivationName;
  epoch: number;
  lossHistory: number[];
};

export function createMlp(config: MlpConfig, seed = 1): MlpModel {
  const rnd = mulberry32(seed);
  const sizes = [2, ...config.hidden, 1];
  const layers: DenseLayer[] = [];
  for (let i = 0; i < sizes.length - 1; i++) {
    const inSize = sizes[i];
    const outSize = sizes[i + 1];
    const scale = Math.sqrt(2 / (inSize + outSize));
    const W = Array.from({ length: outSize * inSize }, () => (rnd() * 2 - 1) * scale);
    const b = Array.from({ length: outSize }, () => 0);
    layers.push({ W, b, inSize, outSize });
  }
  return { layers, activation: config.activation, epoch: 0, lossHistory: [] };
}

function act(name: ActivationName, z: number): number {
  switch (name) {
    case "tanh":
      return Math.tanh(z);
    case "relu":
      return z > 0 ? z : 0;
    case "sigmoid":
      return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z))));
  }
}

function actDeriv(name: ActivationName, a: number, z: number): number {
  switch (name) {
    case "tanh":
      return 1 - a * a;
    case "relu":
      return z > 0 ? 1 : 0;
    case "sigmoid":
      return a * (1 - a);
  }
}

type Cache = {
  zs: number[][];
  as: number[][];
};

function forward(model: MlpModel, x: number[]): Cache {
  const as: number[][] = [x];
  const zs: number[][] = [];
  let cur = x;
  for (let li = 0; li < model.layers.length; li++) {
    const layer = model.layers[li];
    const isLast = li === model.layers.length - 1;
    const z = new Array<number>(layer.outSize);
    const a = new Array<number>(layer.outSize);
    for (let o = 0; o < layer.outSize; o++) {
      let s = layer.b[o];
      for (let i = 0; i < layer.inSize; i++) {
        s += layer.W[o * layer.inSize + i] * cur[i];
      }
      z[o] = s;
      a[o] = isLast ? act("sigmoid", s) : act(model.activation, s);
    }
    zs.push(z);
    as.push(a);
    cur = a;
  }
  return { zs, as };
}

export function predictProb(model: MlpModel, x: number, y: number): number {
  const { as } = forward(model, [x, y]);
  return as[as.length - 1][0];
}

export function predictLabel(model: MlpModel, x: number, y: number): 0 | 1 {
  return predictProb(model, x, y) >= 0.5 ? 1 : 0;
}

/** Binary cross-entropy + L2. */
export function computeLoss(model: MlpModel, data: Sample2D[], l2: number): number {
  if (!data.length) return 0;
  let loss = 0;
  for (const s of data) {
    const p = Math.max(1e-7, Math.min(1 - 1e-7, predictProb(model, s.x, s.y)));
    loss += -(s.label * Math.log(p) + (1 - s.label) * Math.log(1 - p));
  }
  loss /= data.length;
  let reg = 0;
  for (const layer of model.layers) {
    for (const w of layer.W) reg += w * w;
  }
  return loss + 0.5 * l2 * reg;
}

export function accuracy(model: MlpModel, data: Sample2D[]): number {
  if (!data.length) return 1;
  let ok = 0;
  for (const s of data) {
    if (predictLabel(model, s.x, s.y) === s.label) ok += 1;
  }
  return ok / data.length;
}

/**
 * One SGD epoch over shuffled data. Mutates model in place; returns avg loss.
 */
export function trainEpoch(
  model: MlpModel,
  data: Sample2D[],
  learningRate: number,
  l2: number,
  seed = 0,
): number {
  const rnd = mulberry32(seed + model.epoch * 9973 + 13);
  const order = data.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  let totalLoss = 0;
  for (const idx of order) {
    const sample = data[idx];
    const { zs, as } = forward(model, [sample.x, sample.y]);
    const yHat = Math.max(1e-7, Math.min(1 - 1e-7, as[as.length - 1][0]));
    totalLoss += -(sample.label * Math.log(yHat) + (1 - sample.label) * Math.log(1 - yHat));

    // Output delta for BCE + sigmoid: ŷ − y
    let delta: number[] = [yHat - sample.label];

    for (let li = model.layers.length - 1; li >= 0; li--) {
      const layer = model.layers[li];
      const aPrev = as[li];

      const dW = new Array<number>(layer.W.length);
      const dB = new Array<number>(layer.outSize);
      for (let o = 0; o < layer.outSize; o++) {
        dB[o] = delta[o];
        for (let i = 0; i < layer.inSize; i++) {
          dW[o * layer.inSize + i] = delta[o] * aPrev[i] + l2 * layer.W[o * layer.inSize + i];
        }
      }

      let prevDelta: number[] | null = null;
      if (li > 0) {
        prevDelta = new Array<number>(layer.inSize).fill(0);
        for (let i = 0; i < layer.inSize; i++) {
          let s = 0;
          for (let o = 0; o < layer.outSize; o++) {
            s += layer.W[o * layer.inSize + i] * delta[o];
          }
          const prevZ = zs[li - 1][i];
          const prevA = as[li][i];
          prevDelta[i] = s * actDeriv(model.activation, prevA, prevZ);
        }
      }

      for (let o = 0; o < layer.outSize; o++) {
        layer.b[o] -= learningRate * dB[o];
        for (let i = 0; i < layer.inSize; i++) {
          const wi = o * layer.inSize + i;
          layer.W[wi] -= learningRate * dW[wi];
        }
      }

      if (prevDelta) delta = prevDelta;
    }
  }

  const avg = totalLoss / Math.max(1, data.length);
  model.epoch += 1;
  model.lossHistory.push(avg);
  if (model.lossHistory.length > 200) model.lossHistory.shift();
  return avg;
}

/** Evaluate probability grid for heatmap. Returns row-major [gy][gx] in [0,1]. */
export function decisionGrid(
  model: MlpModel,
  resolution: number,
  min = -1.2,
  max = 1.2,
): number[] {
  const out = new Array<number>(resolution * resolution);
  const step = (max - min) / (resolution - 1);
  for (let j = 0; j < resolution; j++) {
    const y = max - j * step;
    for (let i = 0; i < resolution; i++) {
      const x = min + i * step;
      out[j * resolution + i] = predictProb(model, x, y);
    }
  }
  return out;
}
