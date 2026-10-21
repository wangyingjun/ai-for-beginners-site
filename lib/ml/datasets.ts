/** 2D binary classification toy datasets for the MLP playground. */

import { mulberry32 } from "./perceptron";

export type Sample2D = { x: number; y: number; label: 0 | 1 };

export type DatasetId = "circle" | "xor" | "moons" | "gauss";

export const DATASET_IDS: DatasetId[] = ["circle", "xor", "moons", "gauss"];

export function generateDataset(id: DatasetId, n = 200, seed = 7): Sample2D[] {
  switch (id) {
    case "circle":
      return circle(n, seed);
    case "xor":
      return xor(n, seed);
    case "moons":
      return moons(n, seed);
    case "gauss":
      return gauss(n, seed);
  }
}

function circle(n: number, seed: number): Sample2D[] {
  const rnd = mulberry32(seed);
  const out: Sample2D[] = [];
  for (let i = 0; i < n; i++) {
    const angle = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 1.15;
    const x = Math.cos(angle) * r + (rnd() - 0.5) * 0.05;
    const y = Math.sin(angle) * r + (rnd() - 0.5) * 0.05;
    const label: 0 | 1 = x * x + y * y < 0.4 ? 1 : 0;
    out.push({ x, y, label });
  }
  return out;
}

function xor(n: number, seed: number): Sample2D[] {
  const rnd = mulberry32(seed);
  const out: Sample2D[] = [];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    const label: 0 | 1 = x * y > 0 ? 1 : 0;
    out.push({
      x: x + (rnd() - 0.5) * 0.15,
      y: y + (rnd() - 0.5) * 0.15,
      label,
    });
  }
  return out;
}

function moons(n: number, seed: number): Sample2D[] {
  const rnd = mulberry32(seed);
  const out: Sample2D[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const t = Math.PI * rnd();
    out.push({
      x: Math.cos(t) + (rnd() - 0.5) * 0.2,
      y: Math.sin(t) - 0.25 + (rnd() - 0.5) * 0.2,
      label: 0,
    });
  }
  for (let i = 0; i < n - half; i++) {
    const t = Math.PI * rnd();
    out.push({
      x: 1 - Math.cos(t) + (rnd() - 0.5) * 0.2 - 0.5,
      y: 0.25 - Math.sin(t) + (rnd() - 0.5) * 0.2,
      label: 1,
    });
  }
  return out;
}

function gauss(n: number, seed: number): Sample2D[] {
  const rnd = mulberry32(seed);
  const out: Sample2D[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    out.push({
      x: -0.45 + gauss1(rnd) * 0.28,
      y: -0.35 + gauss1(rnd) * 0.28,
      label: 0,
    });
  }
  for (let i = 0; i < n - half; i++) {
    out.push({
      x: 0.45 + gauss1(rnd) * 0.28,
      y: 0.35 + gauss1(rnd) * 0.28,
      label: 1,
    });
  }
  return out;
}

function gauss1(rnd: () => number) {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
