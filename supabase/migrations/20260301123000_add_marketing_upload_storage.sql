create or replace function public.is_pr_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and title = 'PR Staff'
      and active = true
  );
$$;

insert into storage.buckets (id, name, public)
values ('marketing-uploads', 'marketing-uploads', false)
on conflict (id) do nothing;

create policy "submitters_update_own_marketing_requests"
on public.marketing_requests
for update
to authenticated
using (public.is_event_submitter(event_id))
with check (public.is_event_submitter(event_id));

create policy "submitters_upload_own_marketing_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-uploads'
  and public.is_event_submitter((storage.foldername(name))[1]::uuid)
);

create policy "pr_staff_and_admin_read_marketing_files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'marketing-uploads'
  and (public.is_admin() or public.is_pr_staff())
);
