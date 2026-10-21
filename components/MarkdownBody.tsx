import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img || []),
      ["src"],
      ["alt"],
      ["title"],
      ["width"],
      ["height"],
      ["className"],
    ],
    a: [...(defaultSchema.attributes?.a || []), ["href"], ["target"], ["rel"]],
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "img",
    "video",
    "source",
  ],
};

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="markdown-body space-y-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 text-2xl font-bold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 text-xl font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 text-lg font-semibold">{children}</h3>
          ),
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt || ""}
              className="my-3 max-h-[480px] max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
              loading="lazy"
            />
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code className={`${className || ""} text-sm`}>{children}</code>
              );
            }
            return (
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-indigo-300 bg-indigo-50/50 py-1 pl-4 text-zinc-700 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-zinc-300">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-300 bg-zinc-100 px-2 py-1 text-left dark:border-zinc-600 dark:bg-zinc-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-600">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
