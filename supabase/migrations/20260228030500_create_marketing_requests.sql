create table if not exists public.marketing_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  type text not null,
  details text,
  target_audience text,
  priority text default 'standard' check (priority in ('standard', 'urgent')),
  file_url text,
  created_at timestamptz default now()
);
