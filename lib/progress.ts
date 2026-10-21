"use client";

export type ProgressItem = {
  lessonId: string;
  itemType: "lesson" | "quiz" | "notebook" | "playground";
  itemId: string;
  status: string;
  updatedAt: string;
  /** Quiz score 0–1 when itemType === "quiz" */
  score?: number;
};

export type LocalProgressStore = {
  version: 1;
  items: ProgressItem[];
  quizAttempts: Array<{
    quizId: number;
    answers: number[];
    score: number;
    createdAt: string;
  }>;
};

const STORAGE_KEY = "aifb-progress-v1";

function emptyStore(): LocalProgressStore {
  return { version: 1, items: [], quizAttempts: [] };
}

export function loadLocalProgress(): LocalProgressStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as LocalProgressStore;
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return emptyStore();
    return {
      version: 1,
      items: parsed.items,
      quizAttempts: Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : [],
    };
  } catch {
    return emptyStore();
  }
}

export function saveLocalProgress(store: LocalProgressStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function markLessonVisited(lessonId: string): LocalProgressStore {
  const store = loadLocalProgress();
  const now = new Date().toISOString();
  const idx = store.items.findIndex(
    (i) =>
      i.lessonId === lessonId &&
      i.itemType === "lesson" &&
      i.itemId === lessonId,
  );
  const item: ProgressItem = {
    lessonId,
    itemType: "lesson",
    itemId: lessonId,
    status: "visited",
    updatedAt: now,
  };
  if (idx >= 0) store.items[idx] = item;
  else store.items.push(item);
  saveLocalProgress(store);
  return store;
}

export function recordQuizAttemptLocal(input: {
  quizId: number;
  lessonId: string;
  answers: number[];
  score: number;
}): LocalProgressStore {
  const store = loadLocalProgress();
  const now = new Date().toISOString();
  store.quizAttempts.unshift({
    quizId: input.quizId,
    answers: input.answers,
    score: input.score,
    createdAt: now,
  });
  // keep last 100 attempts locally
  store.quizAttempts = store.quizAttempts.slice(0, 100);

  const item: ProgressItem = {
    lessonId: input.lessonId,
    itemType: "quiz",
    itemId: String(input.quizId),
    status: "completed",
    updatedAt: now,
    score: input.score,
  };
  const idx = store.items.findIndex(
    (i) =>
      i.lessonId === input.lessonId &&
      i.itemType === "quiz" &&
      i.itemId === String(input.quizId),
  );
  if (idx >= 0) store.items[idx] = item;
  else store.items.push(item);
  saveLocalProgress(store);
  return store;
}

export function getBestQuizScore(quizId: number): number | null {
  const store = loadLocalProgress();
  const scores = store.quizAttempts
    .filter((a) => a.quizId === quizId)
    .map((a) => a.score);
  if (scores.length === 0) {
    const item = store.items.find(
      (i) => i.itemType === "quiz" && i.itemId === String(quizId),
    );
    return item?.score ?? null;
  }
  return Math.max(...scores);
}
