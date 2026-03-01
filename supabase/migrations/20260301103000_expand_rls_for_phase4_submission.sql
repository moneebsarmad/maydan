create policy "authenticated_read_active_approvers"
on public.users
for select
to authenticated
using (
  active = true
  and role in ('approver', 'admin')
);

create policy "submitters_read_own_approval_steps"
on public.approval_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = approval_steps.event_id
      and events.submitter_id = auth.uid()
  )
);

create policy "submitters_insert_own_approval_steps"
on public.approval_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = approval_steps.event_id
      and events.submitter_id = auth.uid()
  )
);

create policy "event_actors_insert_notifications"
on public.notifications
for insert
to authenticated
with check (
  event_id is not null
  and exists (
    select 1
    from public.events
    where events.id = notifications.event_id
      and (
        events.submitter_id = auth.uid()
        or exists (
          select 1
          from public.approval_steps
          where approval_steps.event_id = notifications.event_id
            and approval_steps.approver_id = auth.uid()
        )
      )
  )
);
