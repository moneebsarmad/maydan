create table if not exists public.marketing_request_comments (
  id uuid primary key default gen_random_uuid(),
  marketing_request_id uuid not null references public.marketing_requests(id) on delete cascade,
  author_id uuid not null references public.users(id),
  comment text not null,
  created_at timestamptz default now()
);

alter table public.marketing_request_comments enable row level security;

create policy "event_participants_read_marketing_request_comments"
on public.marketing_request_comments
for select
to authenticated
using (
  public.is_admin()
  or public.is_pr_staff()
  or exists (
    select 1
    from public.marketing_requests
    where marketing_requests.id = marketing_request_comments.marketing_request_id
      and (
        public.is_event_submitter(marketing_requests.event_id)
        or public.is_event_approver(marketing_requests.event_id)
      )
  )
);

create policy "pr_staff_insert_marketing_request_comments"
on public.marketing_request_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (public.is_admin() or public.is_pr_staff())
  and exists (
    select 1
    from public.marketing_requests
    where marketing_requests.id = marketing_request_comments.marketing_request_id
  )
);

create policy "admin_full_access_marketing_request_comments"
on public.marketing_request_comments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
