import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { EventFilterBar } from "@/components/events/event-filter-bar";
import { getShellUser } from "@/lib/supabase/get-shell-user";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/types";

const allowedStatuses: EventStatus[] = [
  "draft",
  "pending",
  "needs_revision",
  "approved",
  "cancelled",
];

interface EventsPageProps {
  searchParams?: {
    status?: string;
    entity?: string;
    date?: string;
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const user = await getShellUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  const selectedStatus = normalizeStatus(searchParams?.status);
  const selectedEntityId = normalizeSearchValue(searchParams?.entity);
  const selectedDate = normalizeSearchValue(searchParams?.date);
  const isStaffQueue = user.role === "staff";
  const canSubmitEvents = user.role !== "viewer";
  let query = supabase
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
        entity_id,
        entity:entities!events_entity_id_fkey(name, type),
        facility:facilities!events_facility_id_fkey(name)
      `,
    )
    .order("created_at", { ascending: false });

  if (isStaffQueue) {
    query = query.eq("submitter_id", user.id);
  }

  if (selectedStatus) {
    query = query.eq("status", selectedStatus);
  }

  if (selectedEntityId) {
    query = query.eq("entity_id", selectedEntityId);
  }

  if (selectedDate) {
    query = query.eq("date", selectedDate);
  }

  const [{ data: events }, { data: entities }] = await Promise.all([
    query,
    supabase.from("entities").select("id, name").order("name"),
  ]);

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
            {isStaffQueue ? "Submission queue" : "Event overview"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            {isStaffQueue
              ? "Review your saved drafts, pending approvals, and approved events in one place."
              : canSubmitEvents
                ? "Review the events visible to your role and submit new requests when needed."
                : "Review the approved events currently visible under your read-only access."}
          </p>
        </div>

        {canSubmitEvents ? (
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Submit New Event
          </Link>
        ) : null}
      </section>

      <EventFilterBar
        entities={
          entities?.map((entity) => ({
            id: entity.id,
            name: entity.name,
          })) ?? []
        }
        selectedDate={selectedDate}
        selectedEntityId={selectedEntityId}
        selectedStatus={selectedStatus}
      />

      {eventCards.length > 0 ? (
        <section className="space-y-4">
          {eventCards.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          title={
            isStaffQueue
              ? "No events submitted yet"
              : "No visible events right now"
          }
          description={
            isStaffQueue
              ? "Your Maydan submissions will appear here after you save a draft or submit an event."
              : canSubmitEvents
                ? "No events are currently available to your role under the active RLS policies."
                : "No approved events are currently available under the active access rules."
          }
        />
      )}
    </div>
  );
}

function normalizeSearchValue(value?: string) {
  return String(value ?? "").trim();
}

function normalizeStatus(value?: string) {
  const normalizedValue = normalizeSearchValue(value) as EventStatus;
  return allowedStatuses.includes(normalizedValue) ? normalizedValue : "";
}
