import { jupyterliteLabUrl, jupyterliteNotebookUrl } from "@/lib/jupyterlite";
import { type Locale } from "@/lib/i18n";

export function BrowserRunButtons({
  locale,
  notebooks,
}: {
  locale: Locale;
  notebooks: string[];
}) {
  if (!notebooks.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {locale === "zh-CN" ? "在浏览器中运行（JupyterLite / Pyodide）" : "Run in browser (JupyterLite / Pyodide)"}
      </p>
      <div className="flex flex-wrap gap-2">
        {notebooks.map((nb) => (
          <a
            key={nb}
            href={jupyterliteNotebookUrl(nb)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            {locale === "zh-CN" ? "打开" : "Open"} {nb}
          </a>
        ))}
        <a
          href={jupyterliteLabUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          {locale === "zh-CN" ? "打开 JupyterLite 首页" : "Open JupyterLite home"}
        </a>
      </div>
      <p className="text-xs text-zinc-500">
        {locale === "zh-CN"
          ? "首次加载会从 CDN 拉取 Pyodide（数十 MB），请耐心等待。需要 stdin/SharedArrayBuffer 的单元格依赖 COOP/COEP。"
          : "First load fetches Pyodide from CDN (tens of MB). Cells using input()/SharedArrayBuffer need COOP/COEP headers."}
      </p>
    </div>
  );
}
