create or replace function public.is_submitter()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'submitter'
      and active = true
  );
$$;

drop policy if exists "submitters_upload_own_marketing_files" on storage.objects;

create policy "submitters_upload_own_marketing_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-uploads'
  and public.is_submitter()
);
