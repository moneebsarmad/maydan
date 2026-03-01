create or replace function public.is_event_actor(event_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_event_submitter(event_uuid) or public.is_event_approver(event_uuid);
$$;

create or replace function public.is_event_current_approver(event_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    join public.approval_steps
      on approval_steps.event_id = events.id
    where events.id = event_uuid
      and events.status = 'pending'
      and approval_steps.approver_id = auth.uid()
      and approval_steps.step_number = events.current_step
      and approval_steps.status = 'pending'
  );
$$;

create or replace function public.is_current_approval_step(step_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.approval_steps
    join public.events
      on events.id = approval_steps.event_id
    where approval_steps.id = step_uuid
      and events.status = 'pending'
      and approval_steps.approver_id = auth.uid()
      and approval_steps.step_number = events.current_step
      and approval_steps.status = 'pending'
  );
$$;

create or replace function public.can_read_related_user(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    target_user_id = auth.uid()
    or exists (
      select 1
      from public.events
      where submitter_id = target_user_id
        and public.is_event_approver(id)
    )
    or exists (
      select 1
      from public.approval_steps
      join public.events
        on events.id = approval_steps.event_id
      where approval_steps.approver_id = target_user_id
        and public.is_event_submitter(events.id)
    );
$$;

create policy "related_event_actors_read_users"
on public.users
for select
to authenticated
using (public.can_read_related_user(id));

create policy "current_approvers_update_events"
on public.events
for update
to authenticated
using (public.is_event_current_approver(id))
with check (public.is_event_actor(id));

create policy "staff_read_approved_events"
on public.events
for select
to authenticated
using (status = 'approved');

create policy "submitters_update_own_approval_steps"
on public.approval_steps
for update
to authenticated
using (public.is_event_submitter(event_id))
with check (public.is_event_submitter(event_id));

create policy "event_approvers_read_related_steps"
on public.approval_steps
for select
to authenticated
using (public.is_event_approver(event_id));

create policy "current_approvers_update_current_steps"
on public.approval_steps
for update
to authenticated
using (public.is_current_approval_step(id))
with check (public.is_event_approver(event_id));
