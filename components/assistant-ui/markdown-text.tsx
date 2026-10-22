"use client";

import Link from "next/link";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import "@assistant-ui/react-markdown/styles/dot.css";

/**
 * assistant-ui MarkdownText wired for this site's lesson links.
 * Uses @assistant-ui/react-markdown (not a home-grown markdown bubble).
 */
export function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="aui-md prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
      components={{
        a: ({ href, children }) => {
          const h = href || "#";
          if (h.startsWith("/")) {
            return (
              <Link
                href={h}
                className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                {children}
              </Link>
            );
          }
          return (
            <a
              href={h}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            >
              {children}
            </a>
          );
        },
        p: ({ children }) => <p className="my-1.5">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>
        ),
        code: ({ className, children }) => {
          const block = Boolean(className);
          if (block) {
            return (
              <code className="block overflow-x-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
            {children}
          </pre>
        ),
      }}
    />
  );
}
