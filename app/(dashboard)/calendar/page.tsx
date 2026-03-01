import { CalendarShell } from "@/components/calendar/calendar-shell";

export default function CalendarPage() {
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

      <CalendarShell />
    </div>
  );
}
