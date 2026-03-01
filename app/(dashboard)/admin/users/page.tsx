import { UsersAdminShell } from "@/components/admin/users-admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const [{ data: users }, { data: entities }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, email, role, active, entity:entities!users_entity_id_fkey(name)",
      )
      .order("name"),
    supabase.from("entities").select("id, name").order("name"),
  ]);

  return (
    <UsersAdminShell
      entities={
        entities?.map((entity) => ({
          id: entity.id,
          name: entity.name,
        })) ?? []
      }
      users={
        users?.map((user) => {
          const entity = Array.isArray(user.entity) ? user.entity[0] : null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            entityName: entity?.name ?? "Unassigned",
            active: user.active ?? true,
          };
        }) ?? []
      }
    />
  );
}
