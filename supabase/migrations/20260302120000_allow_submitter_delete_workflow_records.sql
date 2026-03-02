drop policy if exists "event_submitters_delete_own_approval_steps" on public.approval_steps;
drop policy if exists "event_submitters_delete_own_marketing_requests" on public.marketing_requests;

create policy "event_submitters_delete_own_approval_steps"
on public.approval_steps
for delete
to authenticated
using (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);

create policy "event_submitters_delete_own_marketing_requests"
on public.marketing_requests
for delete
to authenticated
using (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);
