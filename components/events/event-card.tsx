import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/events/status-badge";
import type { EntityType, EventStatus, GradeLevel } from "@/types";

export interface EventCardEvent {
  id: string;
  name: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  facility: string;
  entity: string;
  entityType: EntityType;
  gradeLevel: GradeLevel;
  marketingNeeded: boolean;
  status: EventStatus;
}

interface EventCardProps {
  event: EventCardEvent;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            {event.entity}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {event.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {event.description ?? "No description provided."}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-stone-600 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-amber-700" />
          {event.date}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-amber-700" />
          {event.startTime} - {event.endTime}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-amber-700" />
          {event.facility}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {formatEntityType(event.entityType)}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {event.gradeLevel}
          </span>
          {event.marketingNeeded ? (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
              Marketing requested
            </span>
          ) : null}
        </div>
        <Link
          href={`/events/${event.id}`}
          prefetch={false}
          className="text-sm font-semibold text-slate-950 transition hover:text-amber-900"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function formatEntityType(entityType: EntityType) {
  if (entityType === "department") {
    return "Department";
  }

  if (entityType === "athletics") {
    return "Athletics";
  }

  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}
