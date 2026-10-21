import type { ReactNode } from "react";
import { MarkdownBody } from "@/components/MarkdownBody";
import type { NotebookCell, NotebookOutput } from "@/lib/content";

function imageSrc(mime: string, raw: string): string {
  const v = raw.replace(/\s/g, "");
  // Extracted asset path from sync (public/lessons/.../nb-assets/...)
  if (v.startsWith("/lessons/") || v.startsWith("http://") || v.startsWith("https://")) {
    return v;
  }
  const kind = mime.includes("png") ? "png" : "jpeg";
  return `data:image/${kind};base64,${v}`;
}

function OutputView({ output }: { output: NotebookOutput }) {
  if (output.output_type === "stream") {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-b-md bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {output.text || ""}
      </pre>
    );
  }

  const data = output.data || {};
  if (data["image/png"]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc("image/png", data["image/png"])}
        alt="notebook output"
        className="my-2 max-h-[420px] max-w-full rounded border border-zinc-200 object-contain dark:border-zinc-700"
      />
    );
  }
  if (data["image/jpeg"] || data["image/jpg"]) {
    const b64 = data["image/jpeg"] || data["image/jpg"] || "";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc("image/jpeg", b64)}
        alt="notebook output"
        className="my-2 max-h-[420px] max-w-full rounded border border-zinc-200 object-contain dark:border-zinc-700"
      />
    );
  }
  if (data["text/html"]) {
    const html = data["text/html"].replace(
      /<script[\s\S]*?<\/script>/gi,
      "<!-- script stripped -->",
    );
    return (
      <div
        className="overflow-x-auto rounded-b-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (data["text/plain"]) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-b-md bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-900">
        {data["text/plain"]}
      </pre>
    );
  }
  if (output.output_type === "error") {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-b-md bg-red-50 p-3 font-mono text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
        {output.text || "Error"}
      </pre>
    );
  }
  if (data["application/javascript"]) {
    return (
      <p className="rounded-b-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Interactive widget output omitted (static MVP). Open in Colab/JupyterLite later.
      </p>
    );
  }
  return null;
}

export function NotebookViewer({
  title,
  cells,
  headerExtra,
}: {
  title: string;
  cells: NotebookCell[];
  headerExtra?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-sm text-zinc-500">{title}</h3>
        {headerExtra}
      </div>
      <div className="space-y-4">
        {cells.map((cell, idx) => {
          if (cell.cell_type === "markdown") {
            return (
              <div
                key={idx}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <MarkdownBody content={cell.source} />
              </div>
            );
          }
          if (cell.cell_type === "code") {
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  <span>In [{cell.execution_count ?? " "}]</span>
                  <span>Python</span>
                </div>
                <pre className="overflow-x-auto bg-zinc-900 p-3 font-mono text-xs text-sky-200">
                  <code>{cell.source}</code>
                </pre>
                {(cell.outputs || []).map((o, oi) => (
                  <OutputView key={oi} output={o} />
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
