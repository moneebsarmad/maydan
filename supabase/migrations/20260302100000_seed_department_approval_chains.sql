with department_slots as (
  select
    entities.id as entity_id,
    entities.name as entity_name,
    'HS'::text as grade_level
  from public.entities
  where entities.type = 'department'
    and coalesce(entities.grade_level, 'Both') in ('HS', 'Both')

  union all

  select
    entities.id as entity_id,
    entities.name as entity_name,
    'MS'::text as grade_level
  from public.entities
  where entities.type = 'department'
    and coalesce(entities.grade_level, 'Both') in ('MS', 'Both')
)
insert into public.approval_chain_templates (
  name,
  entity_id,
  grade_level,
  active,
  updated_at
)
select
  department_slots.entity_name || ' / ' || department_slots.grade_level,
  department_slots.entity_id,
  department_slots.grade_level,
  true,
  timezone('utc', now())
from department_slots
on conflict (entity_id, grade_level) do update
set
  active = true,
  updated_at = timezone('utc', now());

with empty_templates as (
  select
    approval_chain_templates.id as template_id,
    approval_chain_templates.grade_level
  from public.approval_chain_templates
  join public.entities
    on entities.id = approval_chain_templates.entity_id
  where entities.type = 'department'
    and not exists (
      select 1
      from public.approval_chain_template_steps
      where approval_chain_template_steps.template_id = approval_chain_templates.id
    )
)
insert into public.approval_chain_template_steps (
  template_id,
  step_number,
  source_type,
  title_key,
  label_override,
  is_blocking
)
select
  empty_templates.template_id,
  1,
  'entity_head',
  null,
  'Department Head',
  true
from empty_templates

union all

select
  empty_templates.template_id,
  2,
  'title_lookup',
  case
    when empty_templates.grade_level = 'MS' then 'MS Principal'
    else 'HS Principal'
  end,
  case
    when empty_templates.grade_level = 'MS' then 'MS Principal'
    else 'HS Principal'
  end,
  true
from empty_templates
on conflict (template_id, step_number) do nothing;

update public.approval_chain_template_steps
set
  title_key = case
    when approval_chain_templates.grade_level = 'MS' then 'MS Principal'
    else 'HS Principal'
  end
from public.approval_chain_templates
where approval_chain_templates.id = approval_chain_template_steps.template_id
  and approval_chain_template_steps.step_number = 2
  and approval_chain_template_steps.source_type = 'title_lookup'
  and approval_chain_template_steps.title_key is null;
