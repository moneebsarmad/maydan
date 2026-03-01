import { CalendarShell } from "@/components/calendar/calendar-shell";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select(
      `
        id,
        name,
        date,
        grade_level,
        facility:facilities!events_facility_id_fkey(name),
        entity:entities!events_entity_id_fkey(name, type)
      `,
    )
    .eq("status", "approved")
    .order("date", { ascending: true });

  const calendarEvents = (events ?? []).map((event) => {
    const facility = Array.isArray(event.facility) ? event.facility[0] : event.facility;
    const entity = Array.isArray(event.entity) ? event.entity[0] : event.entity;

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      facility: facility?.name ?? "Unassigned facility",
      entity: entity?.name ?? "Unknown entity",
      entityType: entity?.type ?? "club",
      gradeLevel: event.grade_level ?? "HS",
    };
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Calendar
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Internal event calendar
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Approved events are previewed on a monthly grid with entity,
            facility, and grade level filters.
          </p>
        </div>
      </section>

      <CalendarShell events={calendarEvents} />
    </div>
  );
}
