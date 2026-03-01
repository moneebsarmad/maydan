create or replace function public.is_event_submitter(event_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where id = event_uuid
      and submitter_id = auth.uid()
  );
$$;

create or replace function public.is_event_approver(event_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.approval_steps
    where event_id = event_uuid
      and approver_id = auth.uid()
  );
$$;

drop policy if exists "submitters_read_own_events" on public.events;
drop policy if exists "approvers_read_assigned_events" on public.events;
drop policy if exists "submitters_read_own_approval_steps" on public.approval_steps;
drop policy if exists "submitters_insert_own_approval_steps" on public.approval_steps;
drop policy if exists "submitters_read_own_marketing_requests" on public.marketing_requests;
drop policy if exists "submitters_insert_own_marketing_requests" on public.marketing_requests;
drop policy if exists "approvers_read_assigned_marketing_requests" on public.marketing_requests;
drop policy if exists "event_actors_insert_notifications" on public.notifications;

create policy "submitters_read_own_events"
on public.events
for select
to authenticated
using (public.is_event_submitter(id));

create policy "approvers_read_assigned_events"
on public.events
for select
to authenticated
using (public.is_event_approver(id));

create policy "submitters_read_own_approval_steps"
on public.approval_steps
for select
to authenticated
using (public.is_event_submitter(event_id));

create policy "submitters_insert_own_approval_steps"
on public.approval_steps
for insert
to authenticated
with check (public.is_event_submitter(event_id));

create policy "submitters_read_own_marketing_requests"
on public.marketing_requests
for select
to authenticated
using (public.is_event_submitter(event_id));

create policy "submitters_insert_own_marketing_requests"
on public.marketing_requests
for insert
to authenticated
with check (public.is_event_submitter(event_id));

create policy "approvers_read_assigned_marketing_requests"
on public.marketing_requests
for select
to authenticated
using (public.is_event_approver(event_id));

create policy "event_actors_insert_notifications"
on public.notifications
for insert
to authenticated
with check (
  event_id is not null
  and (
    public.is_event_submitter(event_id)
    or public.is_event_approver(event_id)
  )
);
