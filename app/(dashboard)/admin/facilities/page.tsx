import { FacilitiesAdminShell } from "@/components/admin/facilities-admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminFacilitiesPage() {
  const supabase = createClient();
  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, name, capacity, notes, active")
    .order("name");

  return (
    <FacilitiesAdminShell
      facilities={
        facilities?.map((facility) => ({
          id: facility.id,
          name: facility.name,
          capacity: facility.capacity,
          notes: facility.notes,
          active: facility.active ?? true,
        })) ?? []
      }
    />
  );
}
