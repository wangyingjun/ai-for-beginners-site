-- Harden: revoke anon/public EXECUTE on class SECURITY DEFINER helpers.
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
