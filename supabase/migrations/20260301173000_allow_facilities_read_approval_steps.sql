create policy "facilities_director_read_approval_steps"
on public.approval_steps
for select
to authenticated
using (public.is_facilities_director());
