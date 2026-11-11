/** 8×8 2D DCT-II (orthonormal) and top-k reconstruction — a fixed "encoder/decoder" for the bottleneck demo. */
const N = 8;
const C = Array.from({ length: N }, (_, k) =>
  Array.from({ length: N }, (_, n) => (k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N)) * Math.cos(((2 * n + 1) * k * Math.PI) / (2 * N))),
);

export function dct(img: number[]): number[] {
  const out = new Array(64).fill(0);
  for (let u = 0; u < N; u++)
    for (let v = 0; v < N; v++) {
      let s = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s += C[u][y] * C[v][x] * img[y * N + x];
      out[u * N + v] = s;
    }
  return out;
}

export function idct(co: number[]): number[] {
  const out = new Array(64).fill(0);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let u = 0; u < N; u++) for (let v = 0; v < N; v++) s += C[u][y] * C[v][x] * co[u * N + v];
      out[y * N + x] = s;
    }
  return out;
}

/** Keep only the k largest-magnitude coefficients. */
export function reconstruct(img: number[], k: number): number[] {
  const co = dct(img);
  const order = co.map((c, i) => [Math.abs(c), i] as const).sort((a, b) => b[0] - a[0]);
  const kept = new Array(64).fill(0);
  for (let j = 0; j < k; j++) kept[order[j][1]] = co[order[j][1]];
  return idct(kept).map((v) => Math.max(0, Math.min(1, v)));
}

export const wrongCells = (a: number[], rec: number[]) => a.reduce((n, v, i) => n + (v !== (rec[i] >= 0.5 ? 1 : 0) ? 1 : 0), 0);

const P = (rows: string[]) => rows.join("").split("").map((c) => (c === "#" ? 1 : 0));
export const AE_IMAGES: Record<string, { name: string; px: number[] }> = {
  smile: { name: "笑脸", px: P(["..####..", ".#....#.", "#.#..#.#", "#......#", "#.#..#.#", "#..##..#", ".#....#.", "..####.."]) },
  heart: { name: "爱心", px: P(["........", ".##..##.", "########", "########", ".######.", "..####..", "...##...", "........"]) },
  plus: { name: "十字", px: P(["...##...", "...##...", "...##...", "########", "########", "...##...", "...##...", "...##..."]) },
  noise: { name: "乱点", px: P(["#....#.#", "....####", "#..#.###", "##.###..", "....###.", ".###..#.", "#....###", ".##.##.#"]) },
};

/** Add salt noise at fixed positions. */
export const NOISE_AT = [3, 13, 22, 38, 45, 59];
export const withNoise = (px: number[]) => px.map((v, i) => (NOISE_AT.includes(i) ? 1 - v : v));
export function minPerfectK(px: number[]): number {
  for (let k = 1; k <= 64; k++) if (wrongCells(px, reconstruct(px, k)) === 0) return k;
  return 64;
}
