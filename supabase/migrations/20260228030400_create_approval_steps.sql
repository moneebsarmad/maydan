create table if not exists public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  approver_id uuid references public.users(id),
  step_number int not null,
  status text default 'pending' check (status in (
    'pending', 'approved', 'rejected'
  )),
  reason text,
  suggested_date date,
  suggested_start_time time,
  actioned_at timestamptz,
  created_at timestamptz default now()
);
