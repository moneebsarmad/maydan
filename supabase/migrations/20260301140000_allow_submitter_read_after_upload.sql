drop policy if exists "submitters_upload_own_marketing_files" on storage.objects;

create policy "submitters_upload_own_marketing_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-uploads'
  and public.can_upload_marketing_file(name)
);

create policy "submitters_read_own_marketing_files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'marketing-uploads'
  and public.can_upload_marketing_file(name)
);
