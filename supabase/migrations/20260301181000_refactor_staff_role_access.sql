alter table public.users
drop constraint if exists users_role_check;

update public.users
set role = 'staff'
where role = 'submitter';

alter table public.users
add constraint users_role_check
check (role in ('staff', 'approver', 'viewer', 'admin'));

create or replace function public.can_submit_events()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and active = true
      and role in ('staff', 'approver', 'admin')
  );
$$;

create or replace function public.can_upload_marketing_file(object_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    public.can_submit_events()
    and split_part(object_name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
    and public.is_event_submitter(split_part(object_name, '/', 1)::uuid);
$$;

drop policy if exists "submitters_insert_own_events" on public.events;
drop policy if exists "submitters_update_own_events" on public.events;
drop policy if exists "submitters_insert_own_approval_steps" on public.approval_steps;
drop policy if exists "submitters_update_own_approval_steps" on public.approval_steps;
drop policy if exists "submitters_insert_own_marketing_requests" on public.marketing_requests;
drop policy if exists "submitters_update_own_marketing_requests" on public.marketing_requests;
drop policy if exists "submitters_upload_own_marketing_files" on storage.objects;
drop policy if exists "submitters_read_own_marketing_files" on storage.objects;

create policy "staff_insert_own_events"
on public.events
for insert
to authenticated
with check (
  submitter_id = auth.uid()
  and public.can_submit_events()
);

create policy "staff_update_own_events"
on public.events
for update
to authenticated
using (
  submitter_id = auth.uid()
  and public.can_submit_events()
)
with check (
  submitter_id = auth.uid()
  and public.can_submit_events()
);

create policy "event_submitters_insert_own_approval_steps"
on public.approval_steps
for insert
to authenticated
with check (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);

create policy "event_submitters_update_own_approval_steps"
on public.approval_steps
for update
to authenticated
using (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
)
with check (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);

create policy "event_submitters_insert_own_marketing_requests"
on public.marketing_requests
for insert
to authenticated
with check (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);

create policy "event_submitters_update_own_marketing_requests"
on public.marketing_requests
for update
to authenticated
using (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
)
with check (
  public.is_event_submitter(event_id)
  and public.can_submit_events()
);

create policy "internal_submitters_upload_own_marketing_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-uploads'
  and public.can_upload_marketing_file(name)
);

create policy "internal_submitters_read_own_marketing_files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'marketing-uploads'
  and public.can_upload_marketing_file(name)
);
