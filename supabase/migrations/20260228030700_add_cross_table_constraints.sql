alter table public.users
  add constraint users_entity_id_fkey
  foreign key (entity_id) references public.entities(id);

alter table public.entities
  add constraint entities_head_user_id_fkey
  foreign key (head_user_id) references public.users(id);
