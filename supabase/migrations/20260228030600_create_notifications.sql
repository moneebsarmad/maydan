create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  event_id uuid references public.events(id),
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);
