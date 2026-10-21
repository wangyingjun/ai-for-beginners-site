"use client";

import { useState } from "react";

type Notebook = { framework: string; file: string };

const LABELS: Record<string, string> = {
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  numpy: "NumPy / other",
  keras: "Keras",
};

export function FrameworkTabs({
  notebooks,
  children,
}: {
  notebooks: Notebook[];
  children: (active: Notebook) => React.ReactNode;
}) {
  const unique = notebooks.filter(
    (n, i, arr) => arr.findIndex((x) => x.framework === n.framework) === i,
  );
  const [activeFw, setActiveFw] = useState(unique[0]?.framework ?? "numpy");
  const active =
    notebooks.find((n) => n.framework === activeFw) ?? notebooks[0];

  if (!active) return null;

  if (unique.length <= 1) {
    return <>{children(active)}</>;
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
      {children(active)}
    </div>
  );
}
