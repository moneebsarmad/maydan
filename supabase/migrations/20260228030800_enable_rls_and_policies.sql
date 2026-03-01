alter table public.users enable row level security;
alter table public.entities enable row level security;
alter table public.facilities enable row level security;
alter table public.events enable row level security;
alter table public.approval_steps enable row level security;
alter table public.marketing_requests enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_facilities_director()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and title = 'Facilities Director'
  );
$$;

create policy "users_read_own_profile"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "admin_full_access_users"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated_read_entities"
on public.entities
for select
to authenticated
using (true);

create policy "admin_full_access_entities"
on public.entities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated_read_facilities"
on public.facilities
for select
to authenticated
using (active = true);

create policy "admin_full_access_facilities"
on public.facilities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "submitters_read_own_events"
on public.events
for select
to authenticated
using (submitter_id = auth.uid());

create policy "submitters_insert_own_events"
on public.events
for insert
to authenticated
with check (submitter_id = auth.uid());

create policy "submitters_update_own_events"
on public.events
for update
to authenticated
using (submitter_id = auth.uid())
with check (submitter_id = auth.uid());

create policy "approvers_read_assigned_events"
on public.events
for select
to authenticated
using (
  exists (
    select 1
    from public.approval_steps
    where approval_steps.event_id = events.id
      and approval_steps.approver_id = auth.uid()
  )
);

create policy "facilities_director_reads_all_events"
on public.events
for select
to authenticated
using (public.is_facilities_director());

create policy "admin_full_access_events"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "approvers_read_own_steps"
on public.approval_steps
for select
to authenticated
using (approver_id = auth.uid());

create policy "approvers_update_own_steps"
on public.approval_steps
for update
to authenticated
using (approver_id = auth.uid())
with check (approver_id = auth.uid());

create policy "admin_full_access_approval_steps"
on public.approval_steps
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "submitters_read_own_marketing_requests"
on public.marketing_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = marketing_requests.event_id
      and events.submitter_id = auth.uid()
  )
);

create policy "submitters_insert_own_marketing_requests"
on public.marketing_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = marketing_requests.event_id
      and events.submitter_id = auth.uid()
  )
);

create policy "approvers_read_assigned_marketing_requests"
on public.marketing_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.approval_steps
    join public.events on events.id = approval_steps.event_id
    where approval_steps.approver_id = auth.uid()
      and events.id = marketing_requests.event_id
  )
);

create policy "admin_full_access_marketing_requests"
on public.marketing_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users_read_own_notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "users_update_own_notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admin_full_access_notifications"
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
