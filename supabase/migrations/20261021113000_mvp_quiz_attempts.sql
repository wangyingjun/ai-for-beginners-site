-- quiz_attempts + profile auto-create trigger
create table if not exists public.quiz_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id int not null,
  answers jsonb not null default '[]'::jsonb,
  score numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);

alter table public.quiz_attempts enable row level security;

create policy quiz_attempts_select_own on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy quiz_attempts_insert_own on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

create policy quiz_attempts_delete_own on public.quiz_attempts
  for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name', new.email),
    'zh-CN'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
