-- Phase 2 AI tutor RAG: doc_chunks (pgvector) + chat_sessions / chat_messages
-- lesson_id is plain text (curriculum lives in content/lessons.json, not a DB table).

create extension if not exists vector with schema extensions;

create table if not exists public.doc_chunks (
  id bigserial primary key,
  lesson_id text,
  source_path text not null,
  heading text,
  cell_index int,
  lang text not null default 'zh-CN',
  content text not null,
  embedding extensions.vector(1536),
  tsv tsvector generated always as (to_tsvector('simple', coalesce(content, ''))) stored,
  upstream_sha text,
  created_at timestamptz not null default now()
);

create index if not exists doc_chunks_lesson_id_idx on public.doc_chunks (lesson_id);
create index if not exists doc_chunks_lang_idx on public.doc_chunks (lang);
create index if not exists doc_chunks_tsv_idx on public.doc_chunks using gin (tsv);
-- HNSW requires non-null embeddings; create after first upsert with vectors.
-- create index if not exists doc_chunks_embedding_hnsw
--   on public.doc_chunks using hnsw (embedding extensions.vector_cosine_ops);

alter table public.doc_chunks enable row level security;

-- Curriculum chunks are public read; writes via service role only.
drop policy if exists doc_chunks_select_public on public.doc_chunks;
create policy doc_chunks_select_public on public.doc_chunks
  for select using (true);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  lesson_id text,
  locale text default 'zh-CN',
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);

alter table public.chat_sessions enable row level security;

drop policy if exists chat_sessions_select_own on public.chat_sessions;
create policy chat_sessions_select_own on public.chat_sessions
  for select using (auth.uid() = user_id);

drop policy if exists chat_sessions_insert_own on public.chat_sessions;
create policy chat_sessions_insert_own on public.chat_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists chat_sessions_update_own on public.chat_sessions;
create policy chat_sessions_update_own on public.chat_sessions
  for update using (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb,
  tokens int,
  feedback smallint check (feedback is null or feedback in (-1, 1)),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);

alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_select_own on public.chat_messages;
create policy chat_messages_select_own on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists chat_messages_insert_own on public.chat_messages;
create policy chat_messages_insert_own on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists chat_messages_update_own on public.chat_messages;
create policy chat_messages_update_own on public.chat_messages
  for update using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
