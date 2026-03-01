import { EntitiesAdminShell } from "@/components/admin/entities-admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEntitiesPage() {
  const supabase = createClient();
  const [{ data: entities }, { data: users }] = await Promise.all([
    supabase
      .from("entities")
      .select(
        "id, name, type, grade_level, head_user_id, head_user:users!entities_head_user_id_fkey(name)",
      )
      .order("name"),
    supabase
      .from("users")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <EntitiesAdminShell
      entities={
        entities?.map((entity) => {
          const headUser = Array.isArray(entity.head_user)
            ? entity.head_user[0]
            : null;

          return {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            gradeLevel: entity.grade_level,
            headUserId: entity.head_user_id,
            headUserName: headUser?.name ?? "Unassigned",
          };
        }) ?? []
      }
      users={
        users?.map((user) => ({
          id: user.id,
          name: user.name,
        })) ?? []
      }
    />
  );
}
