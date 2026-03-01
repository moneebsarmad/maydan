create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int,
  notes text,
  active boolean default true
);
