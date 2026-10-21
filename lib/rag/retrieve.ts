import indexJson from "@/content/rag/chunks.json";
import type { Locale } from "@/lib/i18n";
import type { RagChunk, RagIndex, RetrievedChunk } from "./types";

const index = indexJson as RagIndex;

/** Tokenize for bilingual keyword scoring (CJK unigrams + Latin words). */
function tokenize(q: string): string[] {
  const lower = q.toLowerCase();
  const latin = lower.match(/[a-z0-9_]{2,}/g) ?? [];
  const cjk = lower.match(/[\u3400-\u9fff]{1,}/g) ?? [];
  const cjkGrams: string[] = [];
  for (const run of cjk) {
    if (run.length === 1) cjkGrams.push(run);
    else {
      for (let i = 0; i < run.length - 1; i++) {
        cjkGrams.push(run.slice(i, i + 2));
      }
    }
  }
  return [...new Set([...latin, ...cjkGrams])];
}

function scoreChunk(
  chunk: RagChunk,
  terms: string[],
  preferLessonId?: string | null,
): number {
  if (!terms.length) return 0;
  const hay = `${chunk.heading ?? ""} ${chunk.content}`.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (!t) continue;
    let idx = 0;
    let hits = 0;
    while ((idx = hay.indexOf(t, idx)) !== -1) {
      hits += 1;
      idx += t.length;
      if (hits > 20) break;
    }
    if (hits) {
      // BM25-ish: saturating TF + mild IDF proxy via term length
      const tf = hits / (hits + 1.2);
      score += tf * (1 + Math.min(2, t.length / 4));
    }
  }
  if (preferLessonId && chunk.lesson_id === preferLessonId) {
    score *= 1.75;
  }
  // Prefer matching UI language lightly
  return score;
}

export function retrieveChunks(opts: {
  query: string;
  locale: Locale;
  lessonId?: string | null;
  topK?: number;
}): RetrievedChunk[] {
  const topK = opts.topK ?? 6;
  const terms = tokenize(opts.query);
  const langPrefer = opts.locale === "zh-CN" ? "zh-CN" : "en";

  const scored: RetrievedChunk[] = [];
  for (const chunk of index.chunks) {
    let s = scoreChunk(chunk, terms, opts.lessonId);
    if (s <= 0) continue;
    if (chunk.lang === langPrefer) s *= 1.15;
    scored.push({
      ...chunk,
      score: s,
      lessonHref: `/lessons/${chunk.lesson_id}?lang=${opts.locale}`,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  let top = scored.slice(0, topK);

  // If nothing matched, fall back to current lesson chunks
  if (!top.length && opts.lessonId) {
    top = index.chunks
      .filter((c) => c.lesson_id === opts.lessonId)
      .slice(0, Math.min(4, topK))
      .map((c) => ({
        ...c,
        score: 0.01,
        lessonHref: `/lessons/${c.lesson_id}?lang=${opts.locale}`,
      }));
  }

  return top;
}

export function getIndexMeta(): Pick<
  RagIndex,
  "generatedAt" | "upstreamSha" | "chunkCount"
> {
  return {
    generatedAt: index.generatedAt,
    upstreamSha: index.upstreamSha,
    chunkCount: index.chunkCount,
  };
}
