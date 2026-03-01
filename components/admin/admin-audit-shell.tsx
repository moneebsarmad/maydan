import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminNav } from "@/components/admin/admin-nav";
import { StatusBadge } from "@/components/events/status-badge";
import type { EventStatus } from "@/types";

interface AuditEntityOption {
  id: string;
  name: string;
}

interface AuditHistoryEntry {
  id: string;
  label: string;
  detail: string;
  occurredAt: string;
}

interface AuditEventItem {
  id: string;
  eventName: string;
  submitterName: string;
  entityName: string;
  status: EventStatus;
  lastUpdated: string;
  eventDate: string;
  history: AuditHistoryEntry[];
}

interface AdminAuditShellProps {
  events: AuditEventItem[];
  entities: AuditEntityOption[];
  filters: {
    status: string;
    entityId: string;
    from: string;
    to: string;
  };
}

const auditStatuses: EventStatus[] = [
  "draft",
  "pending",
  "needs_revision",
  "approved",
  "cancelled",
];

export function AdminAuditShell({
  events,
  entities,
  filters,
}: AdminAuditShellProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Audit log
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Review current event status, the last recorded update, and the
            approval history currently available from live event, approval, and
            facility conflict records.
          </p>
        </div>
        <AdminNav />
      </section>

      <form className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1fr_1fr_1fr_auto] xl:items-end">
          <FilterField htmlFor="status" label="Status">
            <select
              className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
              defaultValue={filters.status}
              id="status"
              name="status"
            >
              <option value="">All statuses</option>
              {auditStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField htmlFor="entity" label="Entity">
            <select
              className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
              defaultValue={filters.entityId}
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
          </FilterField>

          <FilterField htmlFor="from" label="From">
            <input
              className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
              defaultValue={filters.from}
              id="from"
              name="from"
              type="date"
            />
          </FilterField>

          <FilterField htmlFor="to" label="To">
            <input
              className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-700"
              defaultValue={filters.to}
              id="to"
              name="to"
              type="date"
            />
          </FilterField>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Apply filters
            </button>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
              href="/admin/audit"
              prefetch={false}
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      {events.length ? (
        <section className="space-y-4">
          {events.map((event) => (
            <article
              className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
              key={event.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    {event.entityName}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {event.eventName}
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    Submitter: {event.submitterName}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Event date: {formatDate(event.eventDate)} · Last updated:{" "}
                    {formatDateTime(event.lastUpdated)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>

              <div className="mt-5 grid gap-3">
                {event.history.map((historyItem) => (
                  <div
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                    key={historyItem.id}
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-slate-950">
                        {historyItem.label}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {formatDateTime(historyItem.occurredAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {historyItem.detail}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No audit records match these filters"
          description="Adjust the status, entity, or date-range filters to review a different slice of Maydan event activity."
        />
      )}
    </div>
  );
}

function FilterField({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function formatStatusLabel(status: EventStatus) {
  if (status === "needs_revision") {
    return "Needs revision";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
