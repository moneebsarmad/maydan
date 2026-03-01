import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select(
      `
        id,
        name,
        description,
        date,
        start_time,
        end_time,
        grade_level,
        marketing_needed,
        status,
        entity:entities!events_entity_id_fkey(name, type),
        facility:facilities!events_facility_id_fkey(name)
      `,
    )
    .order("created_at", { ascending: false });

  const eventCards = (events ?? []).map((event) => {
    const entity = Array.isArray(event.entity) ? event.entity[0] : event.entity;
    const facility = Array.isArray(event.facility)
      ? event.facility[0]
      : event.facility;

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      facility: facility?.name ?? "Unassigned facility",
      entity: entity?.name ?? "Unknown entity",
      entityType: entity?.type ?? "club",
      gradeLevel: event.grade_level ?? "HS",
      marketingNeeded: event.marketing_needed ?? false,
      status: event.status ?? "draft",
    };
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Events
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Submission queue
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Review your saved drafts, pending approvals, and approved events in
            one place.
          </p>
        </div>

        <Link
          href="/events/new"
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Submit New Event
        </Link>
      </section>

      {eventCards.length > 0 ? (
        <section className="space-y-4">
          {eventCards.map((event) => (
          <EventCard event={event} key={event.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No events submitted yet"
          description="Your Maydan submissions will appear here after you save a draft or submit an event."
        />
      )}
    </div>
  );
}
