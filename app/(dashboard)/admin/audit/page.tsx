import { AdminAuditShell } from "@/components/admin/admin-audit-shell";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus, EventStatus } from "@/types";

const allowedStatuses: EventStatus[] = [
  "draft",
  "pending",
  "needs_revision",
  "approved",
  "cancelled",
];

interface AuditPageProps {
  searchParams?: {
    status?: string;
    entity?: string;
    from?: string;
    to?: string;
  };
}

export default async function AdminAuditPage({
  searchParams,
}: AuditPageProps) {
  const supabase = createClient();
  const filters = {
    status: normalizeStatus(searchParams?.status),
    entityId: normalizeSearchValue(searchParams?.entity),
    from: normalizeSearchValue(searchParams?.from),
    to: normalizeSearchValue(searchParams?.to),
  };

  let auditQuery = supabase
    .from("events")
    .select(
      `
        id,
        name,
        date,
        status,
        created_at,
        updated_at,
        submitter:users!events_submitter_id_fkey(name),
        entity:entities!events_entity_id_fkey(id, name),
        approval_steps(step_number, status, reason, suggested_date, suggested_start_time, actioned_at),
        facility_conflicts(id, notes, created_at)
      `,
    )
    .order("updated_at", { ascending: false });

  if (filters.status) {
    auditQuery = auditQuery.eq("status", filters.status);
  }

  if (filters.entityId) {
    auditQuery = auditQuery.eq("entity_id", filters.entityId);
  }

  if (filters.from) {
    auditQuery = auditQuery.gte("date", filters.from);
  }

  if (filters.to) {
    auditQuery = auditQuery.lte("date", filters.to);
  }

  const [{ data: events }, { data: entities }] = await Promise.all([
    auditQuery,
    supabase.from("entities").select("id, name").order("name"),
  ]);

  return (
    <AdminAuditShell
      entities={
        entities?.map((entity) => ({
          id: entity.id,
          name: entity.name,
        })) ?? []
      }
      events={
        events?.map((event) => {
          const submitter = Array.isArray(event.submitter)
            ? event.submitter[0]
            : event.submitter;
          const entity = Array.isArray(event.entity) ? event.entity[0] : event.entity;

          return {
            id: event.id,
            eventName: event.name,
            submitterName: submitter?.name ?? "Unknown submitter",
            entityName: entity?.name ?? "Unknown entity",
            status: event.status ?? "draft",
            eventDate: event.date,
            lastUpdated: event.updated_at ?? event.created_at ?? new Date().toISOString(),
            history: buildHistory(event),
          };
        }) ?? []
      }
      filters={filters}
    />
  );
}

type AuditEventRecord = {
  id: string;
  name: string;
  date: string;
  status: EventStatus | null;
  created_at: string | null;
  updated_at: string | null;
  approval_steps: {
    step_number: number;
    status: ApprovalStatus | null;
    reason: string | null;
    suggested_date: string | null;
    suggested_start_time: string | null;
    actioned_at: string | null;
  }[] | null;
  facility_conflicts: {
    id: string;
    notes: string;
    created_at: string | null;
  }[] | null;
};

type AuditApprovalStep = NonNullable<AuditEventRecord["approval_steps"]>[number];

function buildHistory(event: AuditEventRecord) {
  const history = [
    {
      id: `${event.id}-created`,
      label: "Event submitted",
      detail: `Maydan received "${event.name}" for ${formatEventDate(event.date)}.`,
      occurredAt: event.created_at ?? new Date().toISOString(),
    },
    ...(event.approval_steps ?? [])
      .filter((step) => step.actioned_at)
      .map((step) => ({
        id: `${event.id}-step-${step.step_number}`,
        label: `Approval step ${step.step_number} ${formatApprovalAction(step)}`,
        detail: buildStepDetail(step),
        occurredAt: step.actioned_at ?? new Date().toISOString(),
      })),
    ...(event.facility_conflicts ?? []).map((conflict) => ({
      id: conflict.id,
      label: "Facility conflict flagged",
      detail: conflict.notes,
      occurredAt: conflict.created_at ?? new Date().toISOString(),
    })),
    {
      id: `${event.id}-status`,
      label: "Current status",
      detail: `Event is currently marked ${formatStatusText(event.status ?? "draft")}.`,
      occurredAt:
        event.updated_at ?? event.created_at ?? new Date().toISOString(),
    },
  ];

  return history.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function buildStepDetail(step: AuditApprovalStep) {
  if (step.suggested_date && step.suggested_start_time) {
    return `Alternative suggested for ${formatEventDate(step.suggested_date)} at ${step.suggested_start_time}.`;
  }

  if (step.reason) {
    return step.reason;
  }

  return "Step completed without additional notes.";
}

function formatApprovalAction(step: AuditApprovalStep) {
  if (step.suggested_date && step.suggested_start_time) {
    return "suggested an alternative";
  }

  if (step.status === "approved") {
    return "approved";
  }

  if (step.status === "rejected") {
    return "requested changes";
  }

  return "updated";
}

function formatStatusText(status: EventStatus) {
  if (status === "needs_revision") {
    return "needs revision";
  }

  return status;
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function normalizeSearchValue(value?: string) {
  return String(value ?? "").trim();
}

function normalizeStatus(value?: string) {
  const normalizedValue = normalizeSearchValue(value) as EventStatus;
  return allowedStatuses.includes(normalizedValue) ? normalizedValue : "";
}
