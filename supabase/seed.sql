insert into public.facilities (name, capacity, notes)
select seed.name, seed.capacity, seed.notes
from (
  values
    ('Auditorium', 350, 'Large-scale events'),
    ('Gym', 280, 'Athletics and assemblies'),
    ('Main Field', 400, 'Outdoor events'),
    ('Classroom', 30, 'Specify room in facility notes'),
    ('MPH', 180, 'Mid-size gatherings'),
    ('Library', 60, 'Small academic programs'),
    ('Conference Room', 18, 'Meetings and small groups')
) as seed(name, capacity, notes)
where not exists (
  select 1
  from public.facilities
  where facilities.name = seed.name
);

insert into public.entities (name, type, grade_level)
select seed.name, seed.type, seed.grade_level
from (
  values
    ('HOSA', 'club', 'HS'),
    ('TED Talk Club', 'club', 'HS'),
    ('Chess Club', 'club', 'Both'),
    ('House of Abu Bakr', 'house', 'Both'),
    ('House of Khadijah', 'house', 'Both'),
    ('House of Umar', 'house', 'Both'),
    ('House of Aishah', 'house', 'Both'),
    ('Science Department', 'department', 'HS'),
    ('Math Department', 'department', 'Both'),
    ('HS Quran Department', 'department', 'HS'),
    ('MS Quran Department', 'department', 'MS'),
    ('HS Islamic Studies Department', 'department', 'HS'),
    ('MS Islamic Studies Department', 'department', 'MS'),
    ('Arabic Department', 'department', 'Both'),
    ('English Department', 'department', 'Both'),
    ('Social Studies Department', 'department', 'Both'),
    ('PE Department', 'department', 'Both'),
    ('Athletics', 'athletics', 'HS')
) as seed(name, type, grade_level)
where not exists (
  select 1
  from public.entities
  where entities.name = seed.name
);
