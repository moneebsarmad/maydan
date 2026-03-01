import Link from "next/link";
import {
  addMonths,
  format,
  formatDistanceToNow,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ArrowUpRight, CalendarDays, ChevronRight, User2 } from "lucide-react";
import type { ShellRole } from "@/components/shared/shell-types";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/events/status-badge";
import { getShellUser } from "@/lib/supabase/get-shell-user";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/types";

type JoinedRecord<T> = T | T[] | null;

interface DashboardEventRow {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: EventStatus | null;
  current_step: number | null;
  created_at: string | null;
  updated_at: string | null;
  entity: JoinedRecord<{
    name: string;
  }>;
  facility: JoinedRecord<{
    name: string;
  }>;
}

interface DashboardApprovalStepRow {
  id: string;
  step_number: number;
  event: JoinedRecord<{
    id: string;
    name: string;
    date: string;
    status: EventStatus | null;
    current_step: number | null;
    submitter: JoinedRecord<{
      name: string;
    }>;
    entity: JoinedRecord<{
      name: string;
    }>;
  }>;
}

interface ActivityItem {
  id: string;
  href: string;
  label: string;
  summary: string;
  occurredAt: string;
}

interface SummaryCard {
  title: string;
  value: number;
  detail: string;
}

export default async function DashboardPage() {
  const user = await getShellUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const today = format(now, "yyyy-MM-dd");

  const [
    pendingEventsResponse,
    approvedThisMonthResponse,
    recentEventsResponse,
    upcomingApprovedEventsResponse,
    pendingApprovalStepsResponse,
  ] = await Promise.all([
    buildVisibleEventsQuery(
      supabase.from("events").select("id", { count: "exact", head: true }),
      user.role,
      user.id,
    ).eq("status", "pending"),
    buildVisibleEventsQuery(
      supabase.from("events").select("id", { count: "exact", head: true }),
      user.role,
      user.id,
    )
      .eq("status", "approved")
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lt("date", format(nextMonthStart, "yyyy-MM-dd")),
    buildVisibleEventsQuery(
      supabase.from("events").select(
        `
          id,
          name,
          date,
          start_time,
          end_time,
          status,
          current_step,
          created_at,
          updated_at,
          entity:entities!events_entity_id_fkey(name),
          facility:facilities!events_facility_id_fkey(name)
        `,
      ),
      user.role,
      user.id,
    )
      .order("updated_at", { ascending: false })
      .limit(4),
    buildVisibleEventsQuery(
      supabase.from("events").select(
        `
          id,
          name,
          date,
          start_time,
          end_time,
          status,
          current_step,
          created_at,
          updated_at,
          entity:entities!events_entity_id_fkey(name),
          facility:facilities!events_facility_id_fkey(name)
        `,
      ),
      user.role,
      user.id,
    )
      .eq("status", "approved")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(3),
    getPendingApprovalSteps(supabase, user.role, user.id),
  ]);

  const pendingEventsCount = pendingEventsResponse.count ?? 0;
  const approvedThisMonthCount = approvedThisMonthResponse.count ?? 0;
  const recentEvents = (recentEventsResponse.data ?? []) as DashboardEventRow[];
  const upcomingApprovedEvents =
    (upcomingApprovedEventsResponse.data ?? []) as DashboardEventRow[];
  const actionableApprovals = toActionableApprovalItems(
    (pendingApprovalStepsResponse.data ?? []) as DashboardApprovalStepRow[],
  );
  const summaryCards = buildSummaryCards({
    role: user.role,
    pendingEventsCount,
    approvedThisMonthCount,
    actionableApprovalCount: actionableApprovals.length,
  });
  const recentActivity = recentEvents.map(buildActivityItem);
  const queuePreview = actionableApprovals.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#111827_0%,_#1e293b_55%,_#334155_100%)] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
          Dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Keep every event moving through the right chain.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Live counts, recent workflow changes, and role-aware queue
              visibility are now pulled directly from Supabase.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100">
            Snapshot for {format(now, "MMMM d")}
            <ArrowUpRight className="h-4 w-4 text-amber-300" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              {card.title}
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {card.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Recent activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                What moved recently
              </h2>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
              Live feed
            </span>
          </div>

          {recentActivity.length > 0 ? (
            <div className="mt-5 space-y-4">
              {recentActivity.map((item) => (
                <Link
                  href={item.href}
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 transition hover:bg-stone-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                      {item.occurredAt}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No activity yet"
                description="New submissions, approvals, and revisions will appear here as your visible event set changes."
              />
            </div>
          )}
        </article>

        {user.role === "approver" || user.role === "admin" ? (
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                  Approval queue
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Awaiting your review
                </h2>
              </div>
              <Link
                href="/approvals"
                className="text-sm font-semibold text-slate-950 transition hover:text-amber-900"
              >
                View all
              </Link>
            </div>

            {queuePreview.length > 0 ? (
              <div className="mt-5 space-y-3">
                {queuePreview.map((item) => (
                  <Link
                    href={`/approvals/${item.eventId}`}
                    key={item.id}
                    className="block rounded-2xl border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {item.entity} · Step {item.stepNumber}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {item.eventName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
                      <span className="inline-flex items-center gap-2">
                        <User2 className="h-4 w-4 text-amber-700" />
                        {item.submitter}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-amber-700" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Queue is clear"
                  description="No approval steps are currently sitting at your turn in the chain."
                />
              </div>
            )}
          </article>
        ) : (
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Upcoming approved events
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Calendar-ready schedule
            </h2>

            {upcomingApprovedEvents.length > 0 ? (
              <div className="mt-5 space-y-3">
                {upcomingApprovedEvents.map((event) => {
                  const entity = normalizeJoin(event.entity);
                  const facility = normalizeJoin(event.facility);

                  return (
                    <Link
                      href={`/events/${event.id}`}
                      key={event.id}
                      className="block rounded-2xl border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            {entity?.name ?? "Unknown entity"}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950">
                            {event.name}
                          </p>
                        </div>
                        <StatusBadge status="approved" />
                      </div>
                      <div className="mt-3 text-sm text-stone-600">
                        {formatDate(event.date)} · {event.start_time} - {event.end_time}
                      </div>
                      <div className="mt-1 text-sm text-stone-600">
                        {facility?.name ?? "Unassigned facility"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="No approved events ahead"
                  description="Approved events that fall on or after today will appear here once they are visible to your role."
                />
              </div>
            )}
          </article>
        )}
      </section>
    </div>
  );
}

function buildVisibleEventsQuery(
  query: any,
  role: ShellRole,
  userId: string,
) {
  if (role === "staff") {
    return query.eq("submitter_id", userId);
  }

  return query;
}

function getPendingApprovalSteps(
  supabase: ReturnType<typeof createClient>,
  role: ShellRole,
  userId: string,
) {
  if (role !== "approver" && role !== "admin") {
    return Promise.resolve({ data: [] as DashboardApprovalStepRow[] });
  }

  let query = supabase
    .from("approval_steps")
    .select(
      `
        id,
        step_number,
        event:events!inner(
          id,
          name,
          date,
          status,
          current_step,
          submitter:users!events_submitter_id_fkey(name),
          entity:entities!events_entity_id_fkey(name)
        )
      `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true }) as any;

  if (role !== "admin") {
    query = query.eq("approver_id", userId);
  }

  return query;
}

function toActionableApprovalItems(steps: DashboardApprovalStepRow[]) {
  return steps
    .map((step) => {
      const event = normalizeJoin(step.event);
      const submitter = normalizeJoin(event?.submitter ?? null);
      const entity = normalizeJoin(event?.entity ?? null);

      if (
        !event ||
        event.status !== "pending" ||
        event.current_step !== step.step_number
      ) {
        return null;
      }

      return {
        id: step.id,
        eventId: event.id,
        eventName: event.name,
        submitter: submitter?.name ?? "Unknown submitter",
        entity: entity?.name ?? "Unknown entity",
        date: event.date,
        stepNumber: step.step_number,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function buildSummaryCards(input: {
  role: ShellRole;
  pendingEventsCount: number;
  approvedThisMonthCount: number;
  actionableApprovalCount: number;
}): SummaryCard[] {
  const pendingEventsTitle =
    input.role === "staff" ? "My Pending Events" : "Visible Pending Events";
  const approvedEventsTitle =
    input.role === "staff" ? "My Approved This Month" : "Approved This Month";

  return [
    {
      title: pendingEventsTitle,
      value: input.pendingEventsCount,
      detail:
        input.role === "staff"
          ? "Submitted requests that are still waiting on the approval chain."
          : "Pending events currently visible within your role-based scope.",
    },
    {
      title: "Awaiting My Approval",
      value: input.actionableApprovalCount,
      detail:
        input.role === "approver" || input.role === "admin"
          ? "Approval steps that are sitting at your current turn in the chain."
          : "This stays at zero for staff and viewer accounts without approval rights.",
    },
    {
      title: approvedEventsTitle,
      value: input.approvedThisMonthCount,
      detail: "Approved events dated within the current month and visible to you.",
    },
  ];
}

function buildActivityItem(event: DashboardEventRow): ActivityItem {
  const entity = normalizeJoin(event.entity);
  const occurredAt = event.updated_at ?? event.created_at ?? new Date().toISOString();
  const formattedOccurredAt = `${formatDistanceToNow(new Date(occurredAt), {
    addSuffix: true,
  })}`;

  switch (event.status) {
    case "approved":
      return {
        id: event.id,
        href: `/events/${event.id}`,
        label: "Event approved",
        summary: `${event.name} for ${entity?.name ?? "an entity"} was approved for ${formatDate(event.date)}.`,
        occurredAt: formattedOccurredAt,
      };
    case "needs_revision":
      return {
        id: event.id,
        href: `/events/${event.id}`,
        label: "Revision requested",
        summary: `${event.name} now needs changes before it can continue through the chain.`,
        occurredAt: formattedOccurredAt,
      };
    case "pending":
      return {
        id: event.id,
        href: `/events/${event.id}`,
        label:
          event.created_at === event.updated_at
            ? "Event submitted"
            : "Approval in progress",
        summary:
          event.created_at === event.updated_at
            ? `${event.name} entered the workflow for ${formatDate(event.date)}.`
            : `${event.name} is currently waiting on step ${event.current_step ?? 1}.`,
        occurredAt: formattedOccurredAt,
      };
    case "cancelled":
      return {
        id: event.id,
        href: `/events/${event.id}`,
        label: "Event cancelled",
        summary: `${event.name} was marked as cancelled.`,
        occurredAt: formattedOccurredAt,
      };
    case "draft":
    default:
      return {
        id: event.id,
        href: `/events/${event.id}`,
        label: "Draft updated",
        summary: `${event.name} is still in draft form for ${formatDate(event.date)}.`,
        occurredAt: formattedOccurredAt,
      };
  }
}

function normalizeJoin<T>(value: JoinedRecord<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string) {
  return format(parseISO(`${value}T00:00:00`), "MMM d, yyyy");
}
