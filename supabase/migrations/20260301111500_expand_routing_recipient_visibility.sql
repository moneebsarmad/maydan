drop policy if exists "authenticated_read_active_approvers" on public.users;

create policy "authenticated_read_routing_recipients"
on public.users
for select
to authenticated
using (
  active = true
  and (
    role in ('approver', 'admin')
    or title in ('Facilities Director', 'PR Staff')
  )
);
