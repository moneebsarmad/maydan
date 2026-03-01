drop policy if exists "current_approvers_update_events" on public.events;

create policy "event_approvers_update_pending_events"
on public.events
for update
to authenticated
using (
  status = 'pending'
  and public.is_event_approver(id)
)
with check (public.is_event_actor(id));
