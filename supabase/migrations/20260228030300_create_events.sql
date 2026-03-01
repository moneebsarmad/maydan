create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  facility_id uuid references public.facilities(id),
  facility_notes text,
  description text,
  audience text[],
  grade_level text check (grade_level in ('MS', 'HS', 'Both')),
  expected_attendance int,
  staffing_needs text,
  marketing_needed boolean default false,
  status text default 'draft' check (status in (
    'draft', 'pending', 'needs_revision', 'approved', 'cancelled'
  )),
  submitter_id uuid references public.users(id),
  entity_id uuid references public.entities(id),
  current_step int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
