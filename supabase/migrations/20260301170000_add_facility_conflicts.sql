create table if not exists public.facility_conflicts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  notes text not null,
  flagged_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.facility_conflicts enable row level security;

create policy "event_participants_read_facility_conflicts"
on public.facility_conflicts
for select
to authenticated
using (
  public.is_event_actor(event_id)
  or public.is_facilities_director()
);

create policy "facilities_director_insert_facility_conflicts"
on public.facility_conflicts
for insert
to authenticated
with check (
  public.is_facilities_director()
  and flagged_by = auth.uid()
  and exists (
    select 1
    from public.events
    where events.id = facility_conflicts.event_id
      and events.status = 'pending'
  )
);

create policy "facilities_director_update_facility_conflicts"
on public.facility_conflicts
for update
to authenticated
using (
  public.is_facilities_director()
)
with check (
  public.is_facilities_director()
  and flagged_by = auth.uid()
  and exists (
    select 1
    from public.events
    where events.id = facility_conflicts.event_id
      and events.status = 'pending'
  )
);

create policy "admin_full_access_facility_conflicts"
on public.facility_conflicts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "facilities_director_read_event_users"
on public.users
for select
to authenticated
using (
  public.is_facilities_director()
  and exists (
    select 1
    from public.events
    left join public.approval_steps
      on approval_steps.event_id = events.id
    where events.submitter_id = users.id
       or approval_steps.approver_id = users.id
  )
);

create policy "facilities_director_insert_event_notifications"
on public.notifications
for insert
to authenticated
with check (
  event_id is not null
  and public.is_facilities_director()
);
