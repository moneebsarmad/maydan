update public.entities
set
  name = 'HS Quran Department',
  grade_level = 'HS'
where name = 'Quran Department';

update public.entities
set
  name = 'HS Islamic Studies Department',
  grade_level = 'HS'
where name = 'Islamic Studies Department';

insert into public.entities (name, type, grade_level)
select seed.name, seed.type, seed.grade_level
from (
  values
    ('MS Quran Department', 'department', 'MS'),
    ('MS Islamic Studies Department', 'department', 'MS')
) as seed(name, type, grade_level)
where not exists (
  select 1
  from public.entities
  where entities.name = seed.name
);
