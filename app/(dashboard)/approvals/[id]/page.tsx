import { notFound } from "next/navigation";
import { ApprovalActionShell } from "@/components/approvals/approval-action-shell";
import { ApprovalChainProgress } from "@/components/approvals/approval-chain-progress";
import { FacilityConflictCard } from "@/components/events/facility-conflict-card";
import { StatusBadge } from "@/components/events/status-badge";
import { getShellUser } from "@/lib/supabase/get-shell-user";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus } from "@/types";

interface ApprovalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ApprovalDetailPage({
  params,
}: ApprovalDetailPageProps) {
  const user = await getShellUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  const { data: event } = await supabase
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
        status,
        current_step,
        submitter:users!events_submitter_id_fkey(id, name),
        entity:entities!events_entity_id_fkey(name, type),
        facility:facilities!events_facility_id_fkey(name)
      `,
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: approvalSteps } = await supabase
    .from("approval_steps")
    .select(
      `
        id,
        step_number,
        status,
        reason,
        suggested_date,
        suggested_start_time,
        actioned_at,
        approver:users!approval_steps_approver_id_fkey(id, name, title)
      `,
    )
    .eq("event_id", params.id)
    .order("step_number", { ascending: true });
  const { data: facilityConflict } = await supabase
    .from("facility_conflicts")
    .select("notes, created_at")
    .eq("event_id", params.id)
    .maybeSingle();

  if (user.role !== "admin" && (approvalSteps?.length ?? 0) === 0) {
    notFound();
  }

  const submitter = Array.isArray(event.submitter)
    ? event.submitter[0]
    : event.submitter;
  const entity = Array.isArray(event.entity) ? event.entity[0] : event.entity;
  const facility = Array.isArray(event.facility) ? event.facility[0] : event.facility;

  const normalizedSteps = (approvalSteps ?? []).map((step) => {
    const approver = Array.isArray(step.approver) ? step.approver[0] : step.approver;

    return {
      id: step.id,
      step: step.step_number,
      status: (step.status ?? "pending") as ApprovalStatus,
      label: approver?.title ?? approver?.name ?? `Approver ${step.step_number}`,
      approverId: approver?.id ?? null,
      reason: step.reason,
      suggestedDate: step.suggested_date,
      suggestedTime: step.suggested_start_time,
      actionedAt: step.actioned_at,
    };
  });

  const currentActionStep = normalizedSteps.find(
    (step) =>
      step.step === event.current_step &&
      step.status === "pending" &&
      step.approverId === user.id,
  );

  const lastDecision = [...normalizedSteps]
    .reverse()
    .find((step) => step.status !== "pending");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Approval review
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              {event.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              {event.description ?? "No description provided."}
            </p>
          </div>
          <StatusBadge status={event.status ?? "draft"} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              Event details
            </h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Submitter"
                value={submitter?.name ?? "Unknown submitter"}
              />
              <DetailItem
                label="Entity"
                value={entity?.name ?? "Unknown entity"}
              />
              <DetailItem label="Date" value={event.date} />
              <DetailItem
                label="Time"
                value={`${event.start_time} - ${event.end_time}`}
              />
              <DetailItem
                label="Facility"
                value={facility?.name ?? "Unassigned facility"}
              />
              <DetailItem
                label="Grade level"
                value={event.grade_level ?? "Not specified"}
              />
            </dl>
          </div>

          {facilityConflict ? (
            <FacilityConflictCard
              notes={facilityConflict.notes}
              createdAt={facilityConflict.created_at}
            />
          ) : null}

          <ApprovalChainProgress steps={normalizedSteps} />

          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Decision history
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Chain activity
                </h2>
              </div>
              {currentActionStep ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-950">
                  Your turn
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {normalizedSteps.map((step) => (
                <article
                  className="rounded-2xl border border-stone-200 px-4 py-4"
                  key={step.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        Step {step.step}
                      </p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {step.label}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        step.status === "approved"
                          ? "approved"
                          : step.status === "rejected"
                            ? "needs_revision"
                            : "pending"
                      }
                    />
                  </div>

                  {step.reason ? (
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      Reason: {step.reason}
                    </p>
                  ) : null}

                  {step.suggestedDate && step.suggestedTime ? (
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      Suggested alternative: {step.suggestedDate} at{" "}
                      {step.suggestedTime}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {step.actionedAt
                      ? `Actioned ${formatActionedAt(step.actionedAt)}`
                      : "Awaiting action"}
                  </p>
                </article>
              ))}
            </div>

            {lastDecision?.status === "rejected" && lastDecision.reason ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-900">
                Latest revision request: {lastDecision.reason}
              </div>
            ) : null}
          </div>
        </section>

        <ApprovalActionShell
          canAct={Boolean(currentActionStep)}
          eventId={event.id}
        />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 px-4 py-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6 text-stone-700">{value}</dd>
    </div>
  );
}

function formatActionedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
