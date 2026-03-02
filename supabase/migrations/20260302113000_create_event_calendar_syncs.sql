create table if not exists public.event_calendar_syncs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  provider text not null check (provider in ('microsoft_outlook')),
  calendar_owner text not null,
  calendar_id text,
  external_event_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, provider)
);

create index if not exists event_calendar_syncs_provider_idx
on public.event_calendar_syncs (provider, sync_status);

alter table public.event_calendar_syncs enable row level security;
