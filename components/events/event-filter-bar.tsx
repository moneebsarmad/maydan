import Link from "next/link";
import type { EventStatus } from "@/types";

interface EntityFilterOption {
  id: string;
  name: string;
}

interface EventFilterBarProps {
  entities: EntityFilterOption[];
  selectedStatus: string;
  selectedEntityId: string;
  selectedDate: string;
}

const statusOptions: EventStatus[] = [
  "draft",
  "pending",
  "needs_revision",
  "approved",
  "cancelled",
];

export function EventFilterBar({
  entities,
  selectedStatus,
  selectedEntityId,
  selectedDate,
}: EventFilterBarProps) {
  return (
    <form className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr_auto] lg:items-end">
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
            htmlFor="status"
          >
            Status
          </label>
          <select
            className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
            defaultValue={selectedStatus}
            id="status"
            name="status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
            htmlFor="entity"
          >
            Entity
          </label>
          <select
            className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
            defaultValue={selectedEntityId}
            id="entity"
            name="entity"
          >
            <option value="">All entities</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
            htmlFor="date"
          >
            Date
          </label>
          <input
            className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
            defaultValue={selectedDate}
            id="date"
            name="date"
            type="date"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            Apply filters
          </button>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
            href="/events"
            prefetch={false}
          >
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}

function formatStatusLabel(status: EventStatus) {
  if (status === "needs_revision") {
    return "Needs revision";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}
