create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null check (role in ('submitter', 'approver', 'viewer', 'admin')),
  title text,
  entity_id uuid,
  active boolean default true,
  created_at timestamptz default now()
);
