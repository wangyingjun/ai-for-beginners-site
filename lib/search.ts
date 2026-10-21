import indexJson from "@/content/search/index.json";
import type { Locale } from "@/lib/i18n";

export type SearchDoc = {
  id: string;
  lessonId: string;
  locale: Locale;
  title: string;
  module: string;
  excerpt: string;
  text: string;
};

type SearchIndex = {
  version: number;
  builtAt: string;
  count: number;
  docs: SearchDoc[];
};

const index = indexJson as SearchIndex;

export function getSearchMeta(): { builtAt: string; count: number } {
  return { builtAt: index.builtAt, count: index.count };
}

export type SearchHit = {
  lessonId: string;
  title: string;
  module: string;
  excerpt: string;
  score: number;
};

function scoreDoc(doc: SearchDoc, terms: string[]): number {
  let score = 0;
  const titleL = doc.title.toLowerCase();
  for (const term of terms) {
    if (!term) continue;
    if (titleL.includes(term)) score += 8;
    if (doc.lessonId === term || doc.lessonId.includes(term)) score += 10;
    // count occurrences in body
    let from = 0;
    while (from < doc.text.length) {
      const i = doc.text.indexOf(term, from);
      if (i < 0) break;
      score += 1;
      from = i + term.length;
      if (score > 40) break;
    }
  }
  return score;
}

export function searchLessons(
  query: string,
  locale: Locale,
  limit = 20,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean).slice(0, 8);
  const docs = index.docs.filter((d) => d.locale === locale);
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, terms);
    if (score <= 0) continue;
    hits.push({
      lessonId: doc.lessonId,
      title: doc.title,
      module: doc.module,
      excerpt: doc.excerpt,
      score,
    });
  }
  hits.sort((a, b) => b.score - a.score || a.lessonId.localeCompare(b.lessonId));
  return hits.slice(0, limit);
}
