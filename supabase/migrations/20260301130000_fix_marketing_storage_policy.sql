create or replace function public.can_upload_marketing_file(object_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    split_part(object_name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
    and public.is_event_submitter(split_part(object_name, '/', 1)::uuid);
$$;

drop policy if exists "submitters_upload_own_marketing_files" on storage.objects;

create policy "submitters_upload_own_marketing_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-uploads'
  and public.can_upload_marketing_file(name)
);
