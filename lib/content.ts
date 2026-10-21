import { readFile } from "fs/promises";
import path from "path";
import type { Locale } from "@/lib/i18n";

export async function loadLessonMarkdown(
  lessonId: string,
  locale: Locale,
): Promise<string | null> {
  const base = path.join(process.cwd(), "content", "lessons", lessonId);
  const preferred =
    locale === "zh-CN"
      ? path.join(base, "README.zh-CN.md")
      : path.join(base, "README.en.md");
  const fallback =
    locale === "zh-CN"
      ? path.join(base, "README.en.md")
      : path.join(base, "README.zh-CN.md");

  for (const candidate of [preferred, fallback]) {
    try {
      return await readFile(candidate, "utf8");
    } catch {
      /* try next */
    }
  }
  return null;
}

export type NotebookCell = {
  cell_type: string;
  source: string;
  outputs?: NotebookOutput[];
  execution_count?: number | null;
};

export type NotebookOutput = {
  output_type: string;
  text?: string;
  data?: Record<string, string>;
  name?: string;
};

function joinSource(source: string | string[] | undefined): string {
  if (!source) return "";
  return Array.isArray(source) ? source.join("") : source;
}

function joinData(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value.join("") : value;
}

function parseNotebookCells(raw: string): NotebookCell[] {
  const nb = JSON.parse(raw) as {
    cells: Array<{
      cell_type: string;
      source: string | string[];
      outputs?: Array<{
        output_type: string;
        text?: string | string[];
        data?: Record<string, string | string[]>;
        name?: string;
      }>;
      execution_count?: number | null;
    }>;
  };
  return nb.cells.map((c) => ({
    cell_type: c.cell_type,
    source: joinSource(c.source),
    execution_count: c.execution_count ?? null,
    outputs: (c.outputs || []).map((o) => ({
      output_type: o.output_type,
      name: o.name,
      text: joinSource(o.text),
      data: o.data
        ? Object.fromEntries(
            Object.entries(o.data).map(([k, v]) => [k, joinData(v)]),
          )
        : undefined,
    })),
  }));
}

/** Prefer zh-CN notebook under notebooks/zh-CN/ when locale is zh-CN; fall back to English. */
export async function loadStaticNotebook(
  lessonId: string,
  fileName: string,
  locale?: Locale,
): Promise<NotebookCell[] | null> {
  const notebooksDir = path.join(
    process.cwd(),
    "content",
    "lessons",
    lessonId,
    "notebooks",
  );
  const enPath = path.join(notebooksDir, fileName);
  const zhPath = path.join(notebooksDir, "zh-CN", fileName);
  const candidates =
    locale === "zh-CN" ? [zhPath, enPath] : [enPath];

  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      return parseNotebookCells(raw);
    } catch {
      /* try next locale candidate */
    }
  }
  return null;
}

/** Lab / Assignment README when present (synced as lab.en.md / lab.zh-CN.md). */
export async function loadLabMarkdown(
  lessonId: string,
  locale: Locale,
): Promise<string | null> {
  const base = path.join(process.cwd(), "content", "lessons", lessonId);
  const preferred =
    locale === "zh-CN"
      ? path.join(base, "lab.zh-CN.md")
      : path.join(base, "lab.en.md");
  const fallback =
    locale === "zh-CN"
      ? path.join(base, "lab.en.md")
      : path.join(base, "lab.zh-CN.md");

  for (const candidate of [preferred, fallback]) {
    try {
      return await readFile(candidate, "utf8");
    } catch {
      /* try next */
    }
  }
  return null;
}
