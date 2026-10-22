"use client";

import Link from "next/link";
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  SquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { ChatCitation } from "@/lib/rag/types";
import { MarkdownText } from "./markdown-text";

export type TutorThreadLabels = {
  empty: string;
  placeholder: string;
  send: string;
  citations: string;
  ragEmpty: string;
};

type Props = {
  labels: TutorThreadLabels;
  /** Extra class on the thread root (height / panel sizing). */
  className?: string;
};

type CitationMeta = {
  citations?: ChatCitation[];
  ragEmpty?: boolean;
};

function CitationFooter({ labels }: { labels: TutorThreadLabels }) {
  const custom = useAuiState(
    (s) => (s.message.metadata?.custom ?? {}) as CitationMeta,
  );
  const citations = custom.citations;
  const ragEmpty = custom.ragEmpty;

  if (!ragEmpty && (!citations || citations.length === 0)) return null;

  return (
    <div className="mt-2 space-y-1 border-t border-zinc-200 pt-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {ragEmpty && (
        <p className="text-amber-700 dark:text-amber-300">{labels.ragEmpty}</p>
      )}
      {citations && citations.length > 0 && (
        <ul className="space-y-1">
          <li className="font-medium text-zinc-500">{labels.citations}</li>
          {citations.map((c, i) => (
            <li key={`${c.path}-${i}`}>
              <Link
                href={c.lessonHref}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {c.lesson_id}
                {c.heading ? ` · ${c.heading}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="ml-6 rounded-lg bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
      <MessagePrimitive.Parts
        components={{
          Text: ({ text }) => (
            <div className="whitespace-pre-wrap break-words">{text}</div>
          ),
        }}
      />
    </MessagePrimitive.Root>
  );
}

/** Hide structured Reasoning parts if a runtime ever emits them. */
function HiddenReasoning() {
  return null;
}

function AssistantMessage({ labels }: { labels: TutorThreadLabels }) {
  return (
    <MessagePrimitive.Root className="mr-6 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
      <MessagePrimitive.Parts
        components={{ Text: MarkdownText, Reasoning: HiddenReasoning }}
      />
      <MessagePrimitive.Error>
        <ErrorPrimitive.Root className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          <ErrorPrimitive.Message />
        </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
      <CitationFooter labels={labels} />
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="mt-2 flex gap-1 text-xs text-zinc-500"
      >
        <ActionBarPrimitive.Copy className="rounded px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <CopyIcon className="size-3.5" />
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.FeedbackPositive className="rounded px-2 py-0.5 data-[submitted]:bg-emerald-100 data-[submitted]:text-emerald-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ThumbsUpIcon className="size-3.5" />
        </ActionBarPrimitive.FeedbackPositive>
        <ActionBarPrimitive.FeedbackNegative className="rounded px-2 py-0.5 data-[submitted]:bg-rose-100 data-[submitted]:text-rose-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ThumbsDownIcon className="size-3.5" />
        </ActionBarPrimitive.FeedbackNegative>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function Composer({ labels }: { labels: TutorThreadLabels }) {
  return (
    <ComposerPrimitive.Root className="flex gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <ComposerPrimitive.Input
        placeholder={labels.placeholder}
        rows={1}
        className="max-h-32 flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <AuiIf condition={(s) => !s.composer.canCancel}>
        <ComposerPrimitive.Send className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-500">
          {labels.send}
          <ArrowUpIcon className="size-3.5" />
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.composer.canCancel}>
        <ComposerPrimitive.Cancel className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <SquareIcon className="size-3.5" />
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </ComposerPrimitive.Root>
  );
}

/**
 * Stock @assistant-ui/react Thread surface (Root → Viewport → Messages +
 * sticky ViewportFooter/Composer). Height chain uses min-h-0 so the Viewport
 * is the only scroll container — do not wrap this in another overflow-y-auto.
 */
export function TutorThread({ labels, className }: Props) {
  return (
    <ThreadPrimitive.Root
      className={
        className ??
        "flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950"
      }
    >
      <ThreadPrimitive.Viewport className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-scroll">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col px-4 pt-3">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <p className="text-sm text-zinc-500">{labels.empty}</p>
          </AuiIf>

          <div className="mb-2 flex flex-col gap-3 empty:hidden">
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "user" ? (
                  <UserMessage />
                ) : (
                  <AssistantMessage labels={labels} />
                )
              }
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto flex flex-col bg-white dark:bg-zinc-950">
            <ThreadPrimitive.ScrollToBottom className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm disabled:invisible dark:border-zinc-700 dark:bg-zinc-900">
              <ArrowDownIcon className="size-4" />
            </ThreadPrimitive.ScrollToBottom>
            <Composer labels={labels} />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
