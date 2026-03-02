"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  Rows3,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "list" | "facilities";

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  facility: string;
  entity: string;
  entityType: string;
  gradeLevel: string;
}

interface CalendarShellProps {
  events: CalendarEvent[];
}

interface VisibleRange {
  start: Date;
  end: Date;
}

const entityTypeStyles: Record<
  string,
  {
    pillClassName: string;
    badgeClassName: string;
    legendClassName: string;
  }
> = {
  club: {
    pillClassName: "border-slate-200 bg-slate-100 text-slate-900",
    badgeClassName: "bg-slate-900 text-white",
    legendClassName: "bg-slate-900",
  },
  house: {
    pillClassName: "border-amber-200 bg-amber-100 text-amber-950",
    badgeClassName: "bg-amber-700 text-white",
    legendClassName: "bg-amber-600",
  },
  athletics: {
    pillClassName: "border-emerald-200 bg-emerald-100 text-emerald-950",
    badgeClassName: "bg-emerald-700 text-white",
    legendClassName: "bg-emerald-600",
  },
  department: {
    pillClassName: "border-sky-200 bg-sky-100 text-sky-950",
    badgeClassName: "bg-sky-700 text-white",
    legendClassName: "bg-sky-600",
  },
};

const calendarViews: Array<{ id: CalendarView; label: string; icon: typeof LayoutGrid }> =
  [
    { id: "month", label: "Month", icon: LayoutGrid },
    { id: "week", label: "Week", icon: Rows3 },
    { id: "list", label: "List", icon: List },
    { id: "facilities", label: "Facilities", icon: Building2 },
  ];

export function CalendarShell({ events }: CalendarShellProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null,
  );

  const sortedEvents = useMemo(
    () => [...events].sort(compareEvents),
    [events],
  );

  const visibleEvents = useMemo(
    () =>
      sortedEvents.filter((event) => {
        const entityTypeMatches =
          entityTypeFilter === "all" || event.entityType === entityTypeFilter;
        const entityMatches =
          entityFilter === "all" || event.entity === entityFilter;
        const facilityMatches =
          facilityFilter === "all" || event.facility === facilityFilter;
        const gradeMatches =
          gradeFilter === "all" || event.gradeLevel === gradeFilter;

        return (
          entityTypeMatches &&
          entityMatches &&
          facilityMatches &&
          gradeMatches
        );
      }),
    [entityFilter, entityTypeFilter, facilityFilter, gradeFilter, sortedEvents],
  );

  const visibleRange = useMemo(
    () => getVisibleRange(view, currentDate),
    [currentDate, view],
  );

  const rangeEvents = useMemo(
    () =>
      visibleEvents.filter((event) =>
        isDateWithinRange(parseISO(event.date), visibleRange),
      ),
    [visibleEvents, visibleRange],
  );

  useEffect(() => {
    if (!isDateWithinRange(selectedDate, visibleRange)) {
      setSelectedDate(startOfDay(visibleRange.start));
    }
  }, [selectedDate, visibleRange]);

  useEffect(() => {
    if (!rangeEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(rangeEvents[0]?.id ?? null);
    }
  }, [rangeEvents, selectedEventId]);

  const selectedEvent =
    rangeEvents.find((event) => event.id === selectedEventId) ?? null;

  const selectedDayEvents = useMemo(
    () =>
      rangeEvents.filter((event) =>
        isSameDay(parseISO(event.date), selectedDate),
      ),
    [rangeEvents, selectedDate],
  );

  const upcomingEvents = useMemo(
    () =>
      rangeEvents
        .filter((event) => parseISO(event.date) >= startOfDay(selectedDate))
        .slice(0, 6),
    [rangeEvents, selectedDate],
  );

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate)),
      }),
    [currentDate],
  );

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      }),
    [currentDate],
  );

  const entityTypes = useMemo(
    () => Array.from(new Set(sortedEvents.map((event) => event.entityType))).sort(),
    [sortedEvents],
  );
  const entities = useMemo(
    () => Array.from(new Set(sortedEvents.map((event) => event.entity))).sort(),
    [sortedEvents],
  );
  const facilities = useMemo(
    () => Array.from(new Set(sortedEvents.map((event) => event.facility))).sort(),
    [sortedEvents],
  );
  const gradeLevels = useMemo(
    () => Array.from(new Set(sortedEvents.map((event) => event.gradeLevel))).sort(),
    [sortedEvents],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(145deg,_#ffffff_0%,_#f8fafc_60%,_#f5f5f4_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Calendar Controls
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {getRangeLabel(view, currentDate)}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                Approved events only. Switch between overview, operational, and
                facility-focused views without leaving the calendar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const today = startOfDay(new Date());
                  setCurrentDate(today);
                  setSelectedDate(today);
                }}
              >
                Today
              </Button>
              <Button
                size="icon"
                type="button"
                variant="outline"
                onClick={() => {
                  const nextDate = shiftCalendarDate(view, currentDate, "previous");
                  setCurrentDate(nextDate);
                  setSelectedDate(nextDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                type="button"
                variant="outline"
                onClick={() => {
                  const nextDate = shiftCalendarDate(view, currentDate, "next");
                  setCurrentDate(nextDate);
                  setSelectedDate(nextDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {calendarViews.map((calendarView) => {
              const Icon = calendarView.icon;

              return (
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                    view === calendarView.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
                  )}
                  key={calendarView.id}
                  onClick={() => setView(calendarView.id)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {calendarView.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <FilterSelect
              label="Entity type"
              options={entityTypes.map((entityType) => ({
                label: formatLabel(entityType),
                value: entityType,
              }))}
              value={entityTypeFilter}
              onChange={setEntityTypeFilter}
            />
            <FilterSelect
              label="Entity"
              options={entities.map((entity) => ({
                label: entity,
                value: entity,
              }))}
              value={entityFilter}
              onChange={setEntityFilter}
            />
            <FilterSelect
              label="Facility"
              options={facilities.map((facility) => ({
                label: facility,
                value: facility,
              }))}
              value={facilityFilter}
              onChange={setFacilityFilter}
            />
            <FilterSelect
              label="Grade level"
              options={gradeLevels.map((gradeLevel) => ({
                label: gradeLevel,
                value: gradeLevel,
              }))}
              value={gradeFilter}
              onChange={setGradeFilter}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-stone-200 bg-white/90 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <CalendarDays className="h-4 w-4" />
              Event legend
            </div>
            {entityTypes.map((entityType) => {
              const style = getEntityTypeStyle(entityType);

              return (
                <span
                  className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700"
                  key={entityType}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", style.legendClassName)} />
                  {formatLabel(entityType)}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.42fr_0.82fr]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          {rangeEvents.length ? (
            <>
              {view === "month" ? (
                <MonthCalendarView
                  currentDate={currentDate}
                  events={rangeEvents}
                  monthDays={monthDays}
                  selectedDate={selectedDate}
                  selectedEventId={selectedEventId}
                  onSelectDate={setSelectedDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}

              {view === "week" ? (
                <WeekCalendarView
                  currentDate={currentDate}
                  events={rangeEvents}
                  selectedDate={selectedDate}
                  selectedEventId={selectedEventId}
                  weekDays={weekDays}
                  onSelectDate={setSelectedDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}

              {view === "list" ? (
                <ListCalendarView
                  currentDate={currentDate}
                  events={rangeEvents}
                  selectedEventId={selectedEventId}
                  onSelectDate={setSelectedDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}

              {view === "facilities" ? (
                <FacilitiesCalendarView
                  currentDate={currentDate}
                  events={rangeEvents}
                  facilityFilter={facilityFilter}
                  selectedEventId={selectedEventId}
                  onSelectDate={setSelectedDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No approved events match this view"
              description="Adjust the filters or move to another date range to review approved events."
            />
          )}
        </section>

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          {selectedEvent ? (
            <SelectedEventPanel event={selectedEvent} />
          ) : selectedDayEvents.length ? (
            <SelectedDayPanel
              date={selectedDate}
              events={selectedDayEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          ) : upcomingEvents.length ? (
            <UpcomingEventsPanel
              events={upcomingEvents}
              rangeLabel={getRangeLabel(view, currentDate)}
              selectedEventId={selectedEventId}
              onSelectDate={setSelectedDate}
              onSelectEvent={setSelectedEventId}
            />
          ) : (
            <EmptyState
              title="No approved events in this range"
              description="Move the calendar or change the filters to inspect another set of approved events."
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function MonthCalendarView({
  currentDate,
  events,
  monthDays,
  selectedDate,
  selectedEventId,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  monthDays: Date[];
  selectedDate: Date;
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Month view
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            {format(currentDate, "MMMM yyyy")}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
          Approved events only
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className="pb-2" key={day}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {monthDays.map((day) => {
              const dayEvents = events.filter((event) =>
                isSameDay(parseISO(event.date), day),
              );
              const visibleDayEvents = dayEvents.slice(0, 3);
              const overflowCount = dayEvents.length - visibleDayEvents.length;

              return (
                <button
                  className={cn(
                    "min-h-[150px] rounded-[1.75rem] border p-3 text-left transition",
                    isSameMonth(day, currentDate)
                      ? "border-stone-200 bg-stone-50/90"
                      : "border-stone-100 bg-stone-50/40 text-stone-400",
                    isWeekend(day) && isSameMonth(day, currentDate)
                      ? "bg-stone-100/70"
                      : null,
                    isSameDay(day, selectedDate)
                      ? "border-slate-950 ring-2 ring-slate-200"
                      : "hover:border-stone-300 hover:bg-stone-50",
                    isToday(day) ? "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.18)]" : null,
                  )}
                  key={day.toISOString()}
                  onClick={() => onSelectDate(startOfDay(day))}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold",
                        isToday(day)
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-950",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {isToday(day) ? (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Today
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    {visibleDayEvents.map((event) => (
                      <EventPill
                        event={event}
                        isSelected={selectedEventId === event.id}
                        key={event.id}
                        onClick={(clickedEvent) => {
                          onSelectDate(parseISO(clickedEvent.date));
                          onSelectEvent(clickedEvent.id);
                        }}
                      />
                    ))}

                    {overflowCount > 0 ? (
                      <button
                        className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 shadow-sm transition hover:bg-stone-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDate(startOfDay(day));
                        }}
                        type="button"
                      >
                        +{overflowCount} more
                      </button>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekCalendarView({
  currentDate,
  events,
  selectedDate,
  selectedEventId,
  weekDays,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  selectedEventId: string | null;
  weekDays: Date[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Week view
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            {getWeekRangeLabel(currentDate)}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
          Operational scheduling
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayEvents = events.filter((event) =>
              isSameDay(parseISO(event.date), day),
            );

            return (
              <div
                className={cn(
                  "rounded-[1.75rem] border p-4",
                  isSameDay(day, selectedDate)
                    ? "border-slate-950 bg-slate-50"
                    : "border-stone-200 bg-stone-50/80",
                )}
                key={day.toISOString()}
              >
                <button
                  className="w-full text-left"
                  onClick={() => onSelectDate(startOfDay(day))}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                    {format(day, "EEE")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold",
                        isToday(day)
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-950",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <span className="text-sm text-stone-500">
                      {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </button>

                <div className="mt-4 space-y-3">
                  {dayEvents.length ? (
                    dayEvents.map((event) => (
                      <button
                        className={cn(
                          "w-full rounded-[1.25rem] border px-4 py-3 text-left transition",
                          getEntityTypeStyle(event.entityType).pillClassName,
                          selectedEventId === event.id
                            ? "ring-2 ring-slate-200"
                            : "hover:-translate-y-0.5 hover:shadow-sm",
                        )}
                        key={event.id}
                        onClick={() => {
                          onSelectDate(parseISO(event.date));
                          onSelectEvent(event.id);
                        }}
                        type="button"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                          {formatTimeRange(event.startTime, event.endTime)}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{event.name}</p>
                        <p className="mt-1 text-xs opacity-80">{event.facility}</p>
                        <p className="mt-1 text-xs opacity-80">{event.entity}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[1.25rem] border border-dashed border-stone-200 bg-white/80 px-3 py-4 text-sm text-stone-500">
                      No approved events.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ListCalendarView({
  currentDate,
  events,
  selectedEventId,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            List view
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            Next 30 days from {format(currentDate, "MMMM d, yyyy")}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
          Mobile-friendly agenda
        </span>
      </div>

      <div className="space-y-6">
        {groupedEvents.map((group) => (
          <div key={group.dateKey}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-950">
                {format(group.date, "EEEE, MMMM d")}
              </h4>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {group.events.length} event{group.events.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-3">
              {group.events.map((event) => (
                <button
                  className={cn(
                    "w-full rounded-[1.5rem] border bg-white px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                    selectedEventId === event.id
                      ? "border-slate-950 ring-2 ring-slate-200"
                      : "border-stone-200",
                  )}
                  key={event.id}
                  onClick={() => {
                    onSelectDate(parseISO(event.date));
                    onSelectEvent(event.id);
                  }}
                  type="button"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                            getEntityTypeStyle(event.entityType).badgeClassName,
                          )}
                        >
                          {formatLabel(event.entityType)}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          {formatTimeRange(event.startTime, event.endTime)}
                        </span>
                      </div>
                      <h5 className="text-xl font-semibold text-slate-950">
                        {event.name}
                      </h5>
                      <p className="text-sm text-stone-600">
                        {event.entity} · {event.facility}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-stone-600 sm:grid-cols-2 lg:text-right">
                      <span>Grade: {event.gradeLevel}</span>
                      <span>Date: {format(parseISO(event.date), "MMM d")}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacilitiesCalendarView({
  currentDate,
  events,
  facilityFilter,
  selectedEventId,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  facilityFilter: string;
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  const groupedByFacility = buildFacilityGroups(events, facilityFilter);

  if (!groupedByFacility.length) {
    return (
      <EmptyState
        title="No facility usage in this week"
        description="Move the calendar or change the filters to review approved room usage."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Facilities view
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            Room usage for {getWeekRangeLabel(currentDate)}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
          Facility coordination
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[880px] gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(groupedByFacility.length, 1)}, minmax(250px, 1fr))`,
          }}
        >
          {groupedByFacility.map((facilityGroup) => (
            <article
              className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-4"
              key={facilityGroup.facility}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                    Facility
                  </p>
                  <h4 className="mt-2 text-xl font-semibold text-slate-950">
                    {facilityGroup.facility}
                  </h4>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 shadow-sm">
                  {facilityGroup.events.length} event
                  {facilityGroup.events.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {groupEventsByDate(facilityGroup.events).map((group) => (
                  <div key={`${facilityGroup.facility}-${group.dateKey}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {format(group.date, "EEE, MMM d")}
                    </p>
                    <div className="mt-2 space-y-2">
                      {group.events.map((event) => (
                        <button
                          className={cn(
                            "w-full rounded-[1.25rem] border px-4 py-3 text-left transition",
                            getEntityTypeStyle(event.entityType).pillClassName,
                            selectedEventId === event.id
                              ? "ring-2 ring-slate-200"
                              : "hover:-translate-y-0.5 hover:shadow-sm",
                          )}
                          key={event.id}
                          onClick={() => {
                            onSelectDate(parseISO(event.date));
                            onSelectEvent(event.id);
                          }}
                          type="button"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                            {formatTimeRange(event.startTime, event.endTime)}
                          </p>
                          <p className="mt-2 text-sm font-semibold">{event.name}</p>
                          <p className="mt-1 text-xs opacity-80">{event.entity}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function SelectedEventPanel({ event }: { event: CalendarEvent }) {
  const style = getEntityTypeStyle(event.entityType);

  return (
    <div className="space-y-5">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
        Event details
      </p>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              style.badgeClassName,
            )}
          >
            {formatLabel(event.entityType)}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
            Approved
          </span>
        </div>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {event.name}
        </h3>
      </div>

      <div className="space-y-3 text-sm text-stone-600">
        <StatCard
          icon={CalendarDays}
          label="Date"
          value={format(parseISO(event.date), "EEEE, MMMM d, yyyy")}
        />
        <StatCard
          icon={Clock3}
          label="Time"
          value={formatTimeRange(event.startTime, event.endTime)}
        />
        <StatCard
          icon={Building2}
          label="Facility"
          value={event.facility}
        />
        <StatCard
          icon={CalendarDays}
          label="Entity"
          value={event.entity}
        />
        <StatCard
          icon={Rows3}
          label="Grade level"
          value={event.gradeLevel}
        />
      </div>
    </div>
  );
}

function SelectedDayPanel({
  date,
  events,
  selectedEventId,
  onSelectEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Selected day
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {format(date, "EEEE, MMMM d")}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <button
            className={cn(
              "w-full rounded-[1.5rem] border px-4 py-4 text-left transition",
              getEntityTypeStyle(event.entityType).pillClassName,
              selectedEventId === event.id
                ? "ring-2 ring-slate-200"
                : "hover:-translate-y-0.5 hover:shadow-sm",
            )}
            key={event.id}
            onClick={() => onSelectEvent(event.id)}
            type="button"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
              {formatTimeRange(event.startTime, event.endTime)}
            </p>
            <p className="mt-2 text-base font-semibold">{event.name}</p>
            <p className="mt-1 text-sm opacity-80">{event.facility}</p>
            <p className="mt-1 text-sm opacity-80">{event.entity}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function UpcomingEventsPanel({
  events,
  rangeLabel,
  selectedEventId,
  onSelectDate,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  rangeLabel: string;
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Upcoming in view
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {rangeLabel}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <button
            className={cn(
              "w-full rounded-[1.5rem] border bg-stone-50 px-4 py-4 text-left transition",
              selectedEventId === event.id
                ? "border-slate-950 ring-2 ring-slate-200"
                : "border-stone-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm",
            )}
            key={event.id}
            onClick={() => {
              onSelectDate(parseISO(event.date));
              onSelectEvent(event.id);
            }}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{event.name}</p>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  getEntityTypeStyle(event.entityType).badgeClassName,
                )}
              >
                {formatLabel(event.entityType)}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {format(parseISO(event.date), "EEE, MMM d")} ·{" "}
              {formatTimeRange(event.startTime, event.endTime)}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {event.facility} · {event.entity}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventPill({
  event,
  isSelected,
  onClick,
}: {
  event: CalendarEvent;
  isSelected: boolean;
  onClick: (event: CalendarEvent) => void;
}) {
  const style = getEntityTypeStyle(event.entityType);

  return (
    <button
      className={cn(
        "w-full rounded-[1.1rem] border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
        style.pillClassName,
        isSelected ? "ring-2 ring-slate-200" : null,
      )}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick(event);
      }}
      type="button"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
        {formatTimeRange(event.startTime, event.endTime)}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
        {event.name}
      </p>
      <p className="mt-1 truncate text-xs opacity-80">{event.facility}</p>
    </button>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <select
        className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">{label}: All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] bg-stone-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white p-2 text-stone-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getVisibleRange(view: CalendarView, currentDate: Date): VisibleRange {
  switch (view) {
    case "month":
      return {
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate)),
      };
    case "week":
    case "facilities":
      return {
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      };
    case "list":
      return {
        start: startOfDay(currentDate),
        end: addDays(startOfDay(currentDate), 29),
      };
    default: {
      const exhaustiveCheck: never = view;
      return exhaustiveCheck;
    }
  }
}

function shiftCalendarDate(
  view: CalendarView,
  currentDate: Date,
  direction: "previous" | "next",
) {
  if (view === "month") {
    return direction === "previous"
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1);
  }

  return direction === "previous"
    ? subWeeks(currentDate, 1)
    : addWeeks(currentDate, 1);
}

function getRangeLabel(view: CalendarView, currentDate: Date) {
  switch (view) {
    case "month":
      return format(currentDate, "MMMM yyyy");
    case "week":
    case "facilities":
      return getWeekRangeLabel(currentDate);
    case "list":
      return `Upcoming from ${format(currentDate, "MMMM d, yyyy")}`;
    default: {
      const exhaustiveCheck: never = view;
      return exhaustiveCheck;
    }
  }
}

function getWeekRangeLabel(currentDate: Date) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
}

function buildFacilityGroups(events: CalendarEvent[], facilityFilter: string) {
  const groupedFacilities = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const currentEvents = groupedFacilities.get(event.facility) ?? [];
    currentEvents.push(event);
    groupedFacilities.set(event.facility, currentEvents);
  }

  if (facilityFilter !== "all") {
    const specificFacilityEvents = groupedFacilities.get(facilityFilter) ?? [];

    return [
      {
        facility: facilityFilter,
        events: specificFacilityEvents,
      },
    ];
  }

  return Array.from(groupedFacilities.entries())
    .map(([facility, facilityEvents]) => ({
      facility,
      events: facilityEvents.sort(compareEvents),
    }))
    .sort((left, right) => left.facility.localeCompare(right.facility));
}

function groupEventsByDate(events: CalendarEvent[]) {
  const groupedDates = new Map<
    string,
    { date: Date; dateKey: string; events: CalendarEvent[] }
  >();

  for (const event of events) {
    const eventDate = parseISO(event.date);
    const dateKey = format(eventDate, "yyyy-MM-dd");
    const currentGroup = groupedDates.get(dateKey);

    if (!currentGroup) {
      groupedDates.set(dateKey, {
        date: eventDate,
        dateKey,
        events: [event],
      });
      continue;
    }

    currentGroup.events.push(event);
  }

  return Array.from(groupedDates.values())
    .map((group) => ({
      ...group,
      events: group.events.sort(compareEvents),
    }))
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

function compareEvents(left: CalendarEvent, right: CalendarEvent) {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  if (left.startTime !== right.startTime) {
    return left.startTime.localeCompare(right.startTime);
  }

  return left.name.localeCompare(right.name);
}

function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function isDateWithinRange(date: Date, range: VisibleRange) {
  return date >= startOfDay(range.start) && date <= startOfDay(range.end);
}

function formatLabel(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEntityTypeStyle(entityType: string) {
  return entityTypeStyles[entityType] ?? entityTypeStyles.club;
}
