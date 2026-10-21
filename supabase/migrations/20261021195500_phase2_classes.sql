-- Phase 2 §4.4 / item ⑤: teacher classes + invite codes + roster progress RLS

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_id_idx on public.classes (teacher_id);
create index if not exists classes_invite_code_idx on public.classes (invite_code);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_members_user_id_idx on public.class_members (user_id);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- Helpers (security definer) avoid RLS recursion when policies cross-reference tables.
create or replace function public.is_class_teacher(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = cid and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_class_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_members cm
    where cm.class_id = cid and cm.user_id = auth.uid()
  );
$$;

create or replace function public.teacher_can_view_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.user_id = target
      and c.teacher_id = auth.uid()
  );
$$;

revoke all on function public.is_class_teacher(uuid) from public;
revoke all on function public.is_class_member(uuid) from public;
revoke all on function public.teacher_can_view_user(uuid) from public;
grant execute on function public.is_class_teacher(uuid) to authenticated;
grant execute on function public.is_class_member(uuid) to authenticated;
grant execute on function public.teacher_can_view_user(uuid) to authenticated;

-- classes policies
drop policy if exists classes_select_own_or_member on public.classes;
create policy classes_select_own_or_member on public.classes
  for select using (
    auth.uid() = teacher_id
    or public.is_class_member(id)
  );

drop policy if exists classes_insert_as_teacher on public.classes;
create policy classes_insert_as_teacher on public.classes
  for insert with check (auth.uid() = teacher_id);

drop policy if exists classes_update_as_teacher on public.classes;
create policy classes_update_as_teacher on public.classes
  for update using (auth.uid() = teacher_id);

drop policy if exists classes_delete_as_teacher on public.classes;
create policy classes_delete_as_teacher on public.classes
  for delete using (auth.uid() = teacher_id);

-- class_members policies
drop policy if exists class_members_select_teacher_or_self on public.class_members;
create policy class_members_select_teacher_or_self on public.class_members
  for select using (
    auth.uid() = user_id
    or public.is_class_teacher(class_id)
  );

drop policy if exists class_members_insert_self on public.class_members;
create policy class_members_insert_self on public.class_members
  for insert with check (auth.uid() = user_id);

drop policy if exists class_members_delete_self_or_teacher on public.class_members;
create policy class_members_delete_self_or_teacher on public.class_members
  for delete using (
    auth.uid() = user_id
    or public.is_class_teacher(class_id)
  );

-- Invite lookup + join (do not expose all invite codes via a broad SELECT policy)
create or replace function public.lookup_class_by_invite(invite text)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name
  from public.classes c
  where upper(c.invite_code) = upper(trim(invite))
  limit 1;
$$;

create or replace function public.join_class_by_invite(invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select c.id into cid
  from public.classes c
  where upper(c.invite_code) = upper(trim(invite))
  limit 1;
  if cid is null then
    raise exception 'invalid invite code';
  end if;
  insert into public.class_members (class_id, user_id)
  values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end;
$$;

revoke all on function public.lookup_class_by_invite(text) from public;
revoke all on function public.join_class_by_invite(text) from public;
grant execute on function public.lookup_class_by_invite(text) to authenticated;
grant execute on function public.join_class_by_invite(text) to authenticated;

-- Teachers may read profiles / progress / quiz_attempts of their class members
drop policy if exists profiles_select_as_teacher on public.profiles;
create policy profiles_select_as_teacher on public.profiles
  for select using (public.teacher_can_view_user(id));

drop policy if exists progress_select_as_teacher on public.progress;
create policy progress_select_as_teacher on public.progress
  for select using (public.teacher_can_view_user(user_id));

drop policy if exists quiz_attempts_select_as_teacher on public.quiz_attempts;
create policy quiz_attempts_select_as_teacher on public.quiz_attempts
  for select using (public.teacher_can_view_user(user_id));

-- Harden grants (anon must not call SECURITY DEFINER helpers via PostgREST)
revoke all on function public.is_class_teacher(uuid) from public, anon;
revoke all on function public.is_class_member(uuid) from public, anon;
revoke all on function public.teacher_can_view_user(uuid) from public, anon;
revoke all on function public.lookup_class_by_invite(text) from public, anon;
revoke all on function public.join_class_by_invite(text) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.is_class_teacher(uuid) to authenticated;
grant execute on function public.is_class_member(uuid) to authenticated;
grant execute on function public.teacher_can_view_user(uuid) to authenticated;
grant execute on function public.lookup_class_by_invite(text) to authenticated;
grant execute on function public.join_class_by_invite(text) to authenticated;
