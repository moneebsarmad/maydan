"use client";

import { useEffect, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  facility: string;
  entity: string;
  entityType: string;
  gradeLevel: string;
}

interface CalendarShellProps {
  events: CalendarEvent[];
}

export function CalendarShell({ events }: CalendarShellProps) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const [entityFilter, setEntityFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null,
  );

  const visibleEvents = events.filter((event) => {
    const entityMatches =
      entityFilter === "all" || event.entityType === entityFilter;
    const facilityMatches =
      facilityFilter === "all" || event.facility === facilityFilter;
    const gradeMatches = gradeFilter === "all" || event.gradeLevel === gradeFilter;

    return entityMatches && facilityMatches && gradeMatches;
  });

  useEffect(() => {
    if (!visibleEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(visibleEvents[0]?.id ?? null);
    }
  }, [selectedEventId, visibleEvents]);

  const selectedEvent =
    visibleEvents.find((event) => event.id === selectedEventId) ?? null;
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });
  const entityTypes = Array.from(new Set(events.map((event) => event.entityType)));
  const facilities = Array.from(new Set(events.map((event) => event.facility)));
  const gradeLevels = Array.from(new Set(events.map((event) => event.gradeLevel)));

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm"
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
          >
            <option value="all">Entity type: All</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {formatLabel(entityType)}
              </option>
            ))}
          </select>
          <select
            className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm"
            value={facilityFilter}
            onChange={(event) => setFacilityFilter(event.target.value)}
          >
            <option value="all">Facility: All</option>
            {facilities.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>
          <select
            className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="all">Grade level: All</option>
            {gradeLevels.map((gradeLevel) => (
              <option key={gradeLevel} value={gradeLevel}>
                {gradeLevel}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">
              {format(monthStart, "MMMM yyyy")}
            </h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
              Approved events only
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className="pb-2" key={day}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {calendarDays.map((day) => {
              const dayEvents = visibleEvents.filter((event) =>
                isSameDay(parseISO(event.date), day),
              );

              return (
                <div
                  className={cn(
                    "min-h-[120px] rounded-3xl border p-3",
                    isSameMonth(day, monthStart)
                      ? "border-stone-200 bg-stone-50"
                      : "border-stone-100 bg-stone-50/50 text-stone-400",
                  )}
                  key={day.toISOString()}
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {format(day, "d")}
                  </p>
                  <div className="mt-3 space-y-2">
                    {dayEvents.map((event) => (
                      <button
                        className="w-full rounded-2xl bg-white px-3 py-2 text-left text-xs text-stone-700 shadow-sm transition hover:bg-amber-50"
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        type="button"
                      >
                        <span className="block font-semibold text-slate-950">
                          {event.name}
                        </span>
                        <span>{event.facility}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Event summary
          </p>
          {selectedEvent ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedEvent.name}
              </h2>
              <div className="mt-5 space-y-3 text-sm text-stone-600">
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Date: {format(parseISO(selectedEvent.date), "MMMM d, yyyy")}
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Facility: {selectedEvent.facility}
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Entity: {selectedEvent.entity}
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Grade level: {selectedEvent.gradeLevel}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No approved events match these filters"
                description="Adjust the entity, facility, or grade-level filters to review another approved event."
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
