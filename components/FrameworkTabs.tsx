"use client";

import { useState } from "react";
import { ExternalRunButtons } from "@/components/ExternalRunButtons";
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
  staticFiles,
}: {
  notebooks: Notebook[];
  locale: Locale;
  path: string;
  staticFiles: string[];
}) {
  const unique = notebooks.filter(
    (n, i, arr) => arr.findIndex((x) => x.framework === n.framework) === i,
  );
  const [activeFw, setActiveFw] = useState(unique[0]?.framework ?? "numpy");
  const active =
    notebooks.find((n) => n.framework === activeFw) ?? notebooks[0];

  if (!active) return null;

  const panel = (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-mono text-sm text-zinc-500">
        {path}/{active.file}
      </p>
      <ExternalRunButtons locale={locale} path={path} file={active.file} />
      {!staticFiles.includes(active.file) && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            {t(locale, "notebookOutput")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t(locale, "notebookOutputHint")}
          </p>
        </div>
      )}
    </div>
  );

  if (unique.length <= 1) {
    return panel;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {unique.map((n) => (
          <button
            key={n.framework}
            type="button"
            onClick={() => setActiveFw(n.framework)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeFw === n.framework
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {LABELS[n.framework] ?? n.framework}
          </button>
        ))}
      </div>
      {panel}
    </div>
  );
}
