/**
 * Simple genetic algorithm: maximize f(x,y) = sin(x)*cos(y) on [0,2π]²
 * with a 2D bitstring genome. Pure TS for lesson 21.
 */

export type Individual = {
  genes: number[]; // 0/1 bits
  x: number;
  y: number;
  fitness: number;
};

export type GAConfig = {
  popSize: number;
  geneBits: number; // bits per coordinate
  mutationRate: number;
  crossoverRate: number;
  elite: number;
};

export const DEFAULT_GA: GAConfig = {
  popSize: 40,
  geneBits: 10,
  mutationRate: 0.02,
  crossoverRate: 0.7,
  elite: 2,
};

const TWO_PI = Math.PI * 2;

export function fitnessXY(x: number, y: number): number {
  // Peak near (π/2, 0) etc.; range roughly [-1,1] → shift to [0,2]
  return Math.sin(x) * Math.cos(y) + 1;
}

function bitsToUnit(bits: number[]): number {
  let v = 0;
  for (let i = 0; i < bits.length; i++) v = (v << 1) | (bits[i] & 1);
  const max = (1 << bits.length) - 1;
  return v / max;
}

export function decode(genes: number[], geneBits: number): { x: number; y: number } {
  const xb = genes.slice(0, geneBits);
  const yb = genes.slice(geneBits);
  return {
    x: bitsToUnit(xb) * TWO_PI,
    y: bitsToUnit(yb) * TWO_PI,
  };
}

export function evaluate(genes: number[], geneBits: number): Individual {
  const { x, y } = decode(genes, geneBits);
  return { genes, x, y, fitness: fitnessXY(x, y) };
}

function randBits(n: number, rng: () => number): number[] {
  return Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
}

export function createPopulation(cfg: GAConfig, rng = Math.random): Individual[] {
  const n = cfg.geneBits * 2;
  return Array.from({ length: cfg.popSize }, () =>
    evaluate(randBits(n, rng), cfg.geneBits),
  );
}

function tournament(pop: Individual[], k: number, rng: () => number): Individual {
  let best = pop[Math.floor(rng() * pop.length)]!;
  for (let i = 1; i < k; i++) {
    const c = pop[Math.floor(rng() * pop.length)]!;
    if (c.fitness > best.fitness) best = c;
  }
  return best;
}

function crossover(
  a: number[],
  b: number[],
  rate: number,
  rng: () => number,
): [number[], number[]] {
  if (rng() > rate) return [[...a], [...b]];
  const point = 1 + Math.floor(rng() * (a.length - 1));
  return [
    [...a.slice(0, point), ...b.slice(point)],
    [...b.slice(0, point), ...a.slice(point)],
  ];
}

function mutate(genes: number[], rate: number, rng: () => number): number[] {
  return genes.map((g) => (rng() < rate ? 1 - g : g));
}

export function evolveGeneration(
  pop: Individual[],
  cfg: GAConfig,
  rng = Math.random,
): Individual[] {
  const sorted = [...pop].sort((a, b) => b.fitness - a.fitness);
  const next: Individual[] = [];
  for (let i = 0; i < cfg.elite && i < sorted.length; i++) {
    next.push({ ...sorted[i]!, genes: [...sorted[i]!.genes] });
  }
  while (next.length < cfg.popSize) {
    const p1 = tournament(sorted, 3, rng);
    const p2 = tournament(sorted, 3, rng);
    const [c1, c2] = crossover(p1.genes, p2.genes, cfg.crossoverRate, rng);
    next.push(evaluate(mutate(c1, cfg.mutationRate, rng), cfg.geneBits));
    if (next.length < cfg.popSize) {
      next.push(evaluate(mutate(c2, cfg.mutationRate, rng), cfg.geneBits));
    }
  }
  return next;
}

export function bestOf(pop: Individual[]): Individual {
  return pop.reduce((a, b) => (a.fitness >= b.fitness ? a : b));
}

export function meanFitness(pop: Individual[]): number {
  return pop.reduce((s, i) => s + i.fitness, 0) / (pop.length || 1);
}
