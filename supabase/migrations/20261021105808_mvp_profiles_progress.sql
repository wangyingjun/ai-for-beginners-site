-- Applied on project miryyieqoiqlgfyzmmql (profiles + progress + RLS).
-- Kept here for documentation / re-apply on new environments.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'learner',
  preferred_framework text,
  locale text default 'zh-CN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

create table if not exists public.progress (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id text not null,
  item_type text not null,
  item_id text not null,
  status text,
  updated_at timestamptz default now(),
  primary key (user_id, lesson_id, item_type, item_id)
);

alter table public.progress enable row level security;

create policy progress_select_own on public.progress for select using (auth.uid() = user_id);
create policy progress_insert_own on public.progress for insert with check (auth.uid() = user_id);
create policy progress_update_own on public.progress for update using (auth.uid() = user_id);
create policy progress_delete_own on public.progress for delete using (auth.uid() = user_id);
