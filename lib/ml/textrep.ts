/** Tiny BoW / TF-IDF helpers for lesson 13–14 demos (pure TS). */

const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "is", "are", "was", "were", "be", "been", "being", "it", "this", "that",
  "with", "as", "by", "from", "not", "no", "do", "does", "did", "i", "you",
  "he", "she", "we", "they", "my", "your", "our",
]);

export function tokenize(text: string, dropStop = true): string[] {
  const toks = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return dropStop ? toks.filter((t) => !STOP.has(t) && t.length > 1) : toks;
}

export function bagOfWords(docs: string[], dropStop = true): {
  vocab: string[];
  matrix: number[][];
  counts: Record<string, number>[];
} {
  const tokenized = docs.map((d) => tokenize(d, dropStop));
  const vocabSet = new Set<string>();
  for (const toks of tokenized) for (const t of toks) vocabSet.add(t);
  const vocab = [...vocabSet].sort();
  const counts: Record<string, number>[] = [];
  const matrix: number[][] = [];
  for (const toks of tokenized) {
    const c: Record<string, number> = {};
    for (const t of toks) c[t] = (c[t] || 0) + 1;
    counts.push(c);
    matrix.push(vocab.map((v) => c[v] || 0));
  }
  return { vocab, matrix, counts };
}

export function tfidf(docs: string[], dropStop = true): {
  vocab: string[];
  matrix: number[][];
  idf: number[];
} {
  const { vocab, matrix } = bagOfWords(docs, dropStop);
  const N = docs.length || 1;
  const df = vocab.map((_, j) => matrix.filter((row) => row[j] > 0).length);
  const idf = df.map((d) => Math.log((N + 1) / (d + 1)) + 1);
  const tfidfMatrix = matrix.map((row) => {
    const sum = row.reduce((a, b) => a + b, 0) || 1;
    return row.map((tf, j) => (tf / sum) * idf[j]);
  });
  return { vocab, matrix: tfidfMatrix, idf };
}

/** Hand-crafted 2D toy embeddings for a small English vocab (lesson 14). */
export const TOY_EMBEDDINGS: { word: string; x: number; y: number; group: string }[] = [
  { word: "king", x: 0.72, y: 0.78, group: "royalty" },
  { word: "queen", x: 0.7, y: 0.62, group: "royalty" },
  { word: "prince", x: 0.62, y: 0.74, group: "royalty" },
  { word: "princess", x: 0.6, y: 0.58, group: "royalty" },
  { word: "man", x: 0.55, y: 0.55, group: "people" },
  { word: "woman", x: 0.52, y: 0.4, group: "people" },
  { word: "boy", x: 0.4, y: 0.5, group: "people" },
  { word: "girl", x: 0.38, y: 0.35, group: "people" },
  { word: "cat", x: 0.2, y: 0.25, group: "animals" },
  { word: "dog", x: 0.28, y: 0.22, group: "animals" },
  { word: "puppy", x: 0.25, y: 0.12, group: "animals" },
  { word: "kitten", x: 0.15, y: 0.14, group: "animals" },
  { word: "paris", x: 0.15, y: 0.8, group: "places" },
  { word: "france", x: 0.22, y: 0.72, group: "places" },
  { word: "london", x: 0.3, y: 0.82, group: "places" },
  { word: "england", x: 0.35, y: 0.7, group: "places" },
  { word: "apple", x: 0.85, y: 0.25, group: "food" },
  { word: "orange", x: 0.9, y: 0.18, group: "food" },
  { word: "bread", x: 0.78, y: 0.12, group: "food" },
  { word: "car", x: 0.88, y: 0.55, group: "vehicles" },
  { word: "bus", x: 0.82, y: 0.48, group: "vehicles" },
  { word: "train", x: 0.92, y: 0.42, group: "vehicles" },
];

export function cosine(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dot = a.x * b.x + a.y * b.y;
  const na = Math.hypot(a.x, a.y) || 1e-9;
  const nb = Math.hypot(b.x, b.y) || 1e-9;
  return dot / (na * nb);
}

export function nearestNeighbors(word: string, k = 5) {
  const target = TOY_EMBEDDINGS.find((w) => w.word === word);
  if (!target) return [];
  return TOY_EMBEDDINGS.filter((w) => w.word !== word)
    .map((w) => ({ word: w.word, group: w.group, score: cosine(target, w) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
