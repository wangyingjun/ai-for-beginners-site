/** Tiny nearest-neighbour "recognizer" for 8×8 drawings (lesson 01). */

export const N = 8;
export type Grid = number[]; // length N*N, 0/1

export const emptyGrid = (): Grid => new Array<number>(N * N).fill(0);

function fromRows(rows: string[]): Grid {
  return rows.join("").split("").map((c) => (c === "#" ? 1 : 0));
}

export const STARTER: { label: string; grid: Grid }[] = [
  { label: "○", grid: fromRows(["........", "..####..", ".#....#.", ".#....#.", ".#....#.", ".#....#.", "..####..", "........"]) },
  { label: "○", grid: fromRows(["........", "........", "...##...", "..#..#..", "..#..#..", "...##...", "........", "........"]) },
  { label: "×", grid: fromRows(["........", ".#....#.", "..#..#..", "...##...", "...##...", "..#..#..", ".#....#.", "........"]) },
  { label: "×", grid: fromRows(["........", "........", "..#..#..", "...##...", "...##...", "..#..#..", "........", "........"]) },
];

/** Shift so the ink's bounding box is centred, then blur a little. */
function normalize(g: Grid): number[] {
  let minR = N, maxR = -1, minC = N, maxC = -1;
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (g[r * N + c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
  if (maxR < 0) return new Array<number>(N * N).fill(0);
  const dr = Math.round((N - 1 - maxR - minR) / 2);
  const dc = Math.round((N - 1 - maxC - minC) / 2);
  const s = new Array<number>(N * N).fill(0);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const rr = r - dr;
      const cc = c - dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) s[r * N + c] = g[rr * N + cc];
    }
  const out = new Array<number>(N * N).fill(0);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      let v = s[r * N + c];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + a;
        const cc = c + b;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N) v += 0.4 * s[rr * N + cc];
      }
      out[r * N + c] = v;
    }
  return out;
}

export function distance(a: Grid, b: Grid): number {
  const na = normalize(a);
  const nb = normalize(b);
  let d = 0;
  for (let i = 0; i < na.length; i++) d += (na[i] - nb[i]) ** 2;
  return d;
}

/** Most similar example (1-nearest-neighbour). */
export function nearest(g: Grid, examples: { label: string; grid: Grid }[]): { index: number; label: string } | null {
  if (!examples.length) return null;
  let best = 0;
  let bd = Infinity;
  examples.forEach((e, i) => {
    const d = distance(g, e.grid);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return { index: best, label: examples[best].label };
}
