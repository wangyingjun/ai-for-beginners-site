export type RagChunk = {
  id: string;
  lesson_id: string;
  path: string;
  heading: string | null;
  cell_index: number | null;
  lang: string;
  content: string;
  token_estimate: number;
  kind?: string;
};

export type RagIndex = {
  generatedAt: string;
  upstreamSha: string | null;
  chunkCount: number;
  chunks: RagChunk[];
};

export type RetrievedChunk = RagChunk & {
  score: number;
  lessonHref: string;
};

export type ChatCitation = {
  lesson_id: string;
  path: string;
  heading: string | null;
  lessonHref: string;
  excerpt: string;
};
