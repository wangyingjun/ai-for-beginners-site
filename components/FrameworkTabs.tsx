"use client";

import { useState } from "react";
import { ExternalRunButtons } from "@/components/ExternalRunButtons";
import { NotebookViewer } from "@/components/NotebookViewer";
import type { NotebookCell } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";

type Notebook = { framework: string; file: string };

const LABELS: Record<string, string> = {
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  numpy: "NumPy / other",
  keras: "Keras",
};

export function FrameworkTabs({
  notebooks,
  locale,
  path,
  staticByFile,
}: {
  notebooks: Notebook[];
  locale: Locale;
  path: string;
  /** Pre-loaded static cells keyed by notebook file name (may include lab/ prefix). */
  staticByFile: Record<string, NotebookCell[]>;
}) {
  const [activeFile, setActiveFile] = useState(notebooks[0]?.file ?? "");
  const active =
    notebooks.find((n) => n.file === activeFile) ?? notebooks[0];

  if (!active) return null;

  const cells = staticByFile[active.file];
  const collapse = cells && cells.length >= 6;

  const panel = (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-mono text-sm text-zinc-500">
        {path}/{active.file}
      </p>
      <ExternalRunButtons locale={locale} path={path} file={active.file} />
      {cells ? (
        collapse ? (
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 open:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:open:bg-zinc-950">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {t(locale, "notebookExpand")} — {active.file} ({cells.length})
            </summary>
            <div className="space-y-3 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">{t(locale, "notebookExpandHint")}</p>
              <NotebookViewer title={active.file} cells={cells} />
            </div>
          </details>
        ) : (
          <NotebookViewer title={active.file} cells={cells} />
        )
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            {t(locale, "notebookOutput")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t(locale, "notebookExternalOnly")}
          </p>
        </div>
      )}
    </div>
  );

  if (notebooks.length <= 1) {
    return panel;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {notebooks.map((n) => {
          const label = `${LABELS[n.framework] ?? n.framework} · ${n.file.replace(/^lab\//, "lab/")}`;
          return (
            <button
              key={n.file}
              type="button"
              onClick={() => setActiveFile(n.file)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeFile === n.file
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {panel}
    </div>
  );
}
