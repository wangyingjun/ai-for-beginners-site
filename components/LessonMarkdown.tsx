import { readFile } from "fs/promises";
import path from "path";

/** Very small Markdown-ish renderer for sample bodies (headings + paragraphs). */
function roughMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${para.join(" ")}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith("```")) {
      flushPara();
      inCode = !inCode;
      out.push(inCode ? "<pre><code>" : "</code></pre>");
      continue;
    }
    if (inCode) {
      out.push(
        line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") + "\n",
      );
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flushPara();
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#{1,3}\s+/, "");
      out.push(`<h${level}>${escapeInline(text)}</h${level}>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (line.startsWith("> ") || line.startsWith("|") || line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      out.push(`<p>${escapeInline(line)}</p>`);
      continue;
    }
    para.push(escapeInline(line));
  }
  flushPara();
  return out.join("\n");
}

function escapeInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export async function LessonMarkdown({
  slug,
  locale,
}: {
  slug: string;
  locale: "zh-CN" | "en";
}) {
  const base = path.join(process.cwd(), "content", "samples");
  const preferred = path.join(base, `${slug}.${locale}.md`);
  const fallback = path.join(
    base,
    `${slug}.${locale === "zh-CN" ? "en" : "zh-CN"}.md`,
  );

  let raw: string | null = null;
  try {
    raw = await readFile(preferred, "utf8");
  } catch {
    try {
      raw = await readFile(fallback, "utf8");
    } catch {
      raw = null;
    }
  }

  if (!raw) return null;

  // Keep page lean: show first ~80 lines
  const clipped = raw.split(/\r?\n/).slice(0, 80).join("\n");
  const html = roughMarkdownToHtml(clipped);

  return (
    <article
      className="prose-sample space-y-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 dark:[&_code]:bg-zinc-800 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-zinc-100"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
