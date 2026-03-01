"use client";

import { useState } from "react";
import { calendarEvents } from "@/lib/utils/demo-data";

const days = Array.from({ length: 35 }, (_, index) => index + 1);

export function CalendarShell() {
  const [selectedEventTitle, setSelectedEventTitle] = useState<string | null>(
    calendarEvents[0]?.title ?? null,
  );
  const selectedEvent =
    calendarEvents.find((item) => item.title === selectedEventTitle) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm">
            <option>Entity type: All</option>
            <option>Club</option>
            <option>House</option>
            <option>Department</option>
            <option>Athletics</option>
          </select>
          <select className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm">
            <option>Facility: All</option>
            <option>Auditorium</option>
            <option>Gym</option>
            <option>Library</option>
          </select>
          <select className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-950 shadow-sm">
            <option>Grade level: All</option>
            <option>MS</option>
            <option>HS</option>
            <option>Both</option>
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">March 2026</h2>
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
            {days.map((day) => {
              const events = calendarEvents.filter((event) => event.date === day);

              return (
                <div
                  className="min-h-[120px] rounded-3xl border border-stone-200 bg-stone-50 p-3"
                  key={day}
                >
                  <p className="text-sm font-semibold text-slate-950">{day}</p>
                  <div className="mt-3 space-y-2">
                    {events.map((event) => (
                      <button
                        className="w-full rounded-2xl bg-white px-3 py-2 text-left text-xs text-stone-700 shadow-sm transition hover:bg-amber-50"
                        key={event.title}
                        onClick={() => setSelectedEventTitle(event.title)}
                        type="button"
                      >
                        <span className="block font-semibold text-slate-950">
                          {event.title}
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
                {selectedEvent.title}
              </h2>
              <div className="mt-5 space-y-3 text-sm text-stone-600">
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Date: March {selectedEvent.date}, 2026
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Facility: {selectedEvent.facility}
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-4">
                  Status: Approved and visible to all staff.
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-stone-600">
              Select an event on the calendar to preview its summary here.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
