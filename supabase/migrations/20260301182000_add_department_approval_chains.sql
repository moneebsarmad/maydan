create table public.approval_chain_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity_id uuid not null references public.entities(id) on delete cascade,
  grade_level text not null check (grade_level in ('MS', 'HS')),
  active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entity_id, grade_level)
);

create table public.approval_chain_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.approval_chain_templates(id) on delete cascade,
  step_number integer not null check (step_number > 0),
  source_type text not null check (source_type in ('entity_head', 'specific_user', 'title_lookup')),
  user_id uuid references public.users(id) on delete set null,
  title_key text,
  label_override text,
  is_blocking boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, step_number),
  check (
    (source_type = 'entity_head' and user_id is null and title_key is null)
    or (source_type = 'specific_user' and user_id is not null and title_key is null)
    or (source_type = 'title_lookup' and user_id is null and title_key is not null)
  )
);

create index approval_chain_templates_entity_grade_idx
  on public.approval_chain_templates (entity_id, grade_level, active);

create index approval_chain_template_steps_template_idx
  on public.approval_chain_template_steps (template_id, step_number);

alter table public.approval_chain_templates enable row level security;
alter table public.approval_chain_template_steps enable row level security;

create policy "authenticated_read_active_approval_chain_templates"
on public.approval_chain_templates
for select
to authenticated
using (active = true);

create policy "authenticated_read_steps_for_active_chain_templates"
on public.approval_chain_template_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.approval_chain_templates
    where approval_chain_templates.id = approval_chain_template_steps.template_id
      and approval_chain_templates.active = true
  )
);

create policy "admin_full_access_approval_chain_templates"
on public.approval_chain_templates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin_full_access_approval_chain_template_steps"
on public.approval_chain_template_steps
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
