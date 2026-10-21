import raw from "@/content/lessons.json";
import type {
  ContentManifest,
  LessonManifest,
  ModuleManifest,
} from "@/lib/types";

export type Locale = "zh-CN" | "en";
export type Lesson = LessonManifest;
export type Module = ModuleManifest;

const manifest = raw as ContentManifest;

export const UPSTREAM_REPO = manifest.upstream.repo;
export const UPSTREAM_COMMIT = manifest.upstream.commit;

export function getModules(): Module[] {
  return [...manifest.modules].sort((a, b) => a.order - b.order);
}

export function getLessons(): Lesson[] {
  return manifest.lessons;
}

export function getLessonById(id: string): Lesson | undefined {
  return manifest.lessons.find((l) => l.id === id || l.slug === id);
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  return manifest.lessons.filter((l) => l.module === moduleId);
}

export function getModule(moduleId: string): Module | undefined {
  return manifest.modules.find((m) => m.id === moduleId);
}

export function localizedTitle(
  item: { title: { "zh-CN": string; en: string } },
  locale: Locale,
): string {
  return item.title[locale] || item.title["zh-CN"] || item.title.en;
}

export function githubBlobUrl(relativePath: string, file?: string): string {
  const path = file ? `${relativePath}/${file}` : relativePath;
  return `https://github.com/${UPSTREAM_REPO}/blob/${UPSTREAM_COMMIT}/${path}`;
}

export function colabUrl(relativePath: string, file: string): string {
  return `https://colab.research.google.com/github/${UPSTREAM_REPO}/blob/${UPSTREAM_COMMIT}/${relativePath}/${file}`;
}

export function codespacesUrl(_relativePath?: string, _file?: string): string {
  return `https://github.com/codespaces/new?hide_repo_select=true&ref=${UPSTREAM_COMMIT}&repo=microsoft%2FAI-For-Beginners&machine=basicLinux32gb&devcontainer_path=.devcontainer%2Fdevcontainer.json&location=EastUs`;
}

export function binderUrl(relativePath: string, file: string): string {
  return `https://mybinder.org/v2/gh/${UPSTREAM_REPO}/${UPSTREAM_COMMIT}?filepath=${encodeURIComponent(`${relativePath}/${file}`)}`;
}

export function adjacentLessons(id: string): {
  prev?: Lesson;
  next?: Lesson;
} {
  const list = getLessons();
  const idx = list.findIndex((l) => l.id === id || l.slug === id);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? list[idx - 1] : undefined,
    next: idx < list.length - 1 ? list[idx + 1] : undefined,
  };
}
