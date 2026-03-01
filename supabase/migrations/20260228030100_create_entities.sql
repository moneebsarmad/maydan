create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('club', 'house', 'department', 'athletics')),
  grade_level text check (grade_level in ('MS', 'HS', 'Both')),
  head_user_id uuid,
  created_at timestamptz default now()
);
