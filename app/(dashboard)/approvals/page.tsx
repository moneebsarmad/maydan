import { ApprovalQueueItem } from "@/components/approvals/approval-queue-item";
import { EmptyState } from "@/components/shared/empty-state";
import { getShellUser } from "@/lib/supabase/get-shell-user";
import { createClient } from "@/lib/supabase/server";

export default async function ApprovalsPage() {
  const user = await getShellUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  let query = supabase
    .from("approval_steps")
    .select(
      `
        id,
        step_number,
        status,
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
    .order("created_at", { ascending: true });

  if (user.role !== "admin") {
    query = query.eq("approver_id", user.id);
  }

  const { data: approvalSteps } = await query;
  const queueItems = (approvalSteps ?? [])
    .map((step) => {
      const event = Array.isArray(step.event) ? step.event[0] : step.event;
      const submitter = Array.isArray(event?.submitter)
        ? event.submitter[0]
        : event?.submitter;
      const entity = Array.isArray(event?.entity) ? event.entity[0] : event?.entity;

      if (
        !event ||
        event.status !== "pending" ||
        event.current_step !== step.step_number
      ) {
        return null;
      }

      return {
        eventId: event.id,
        eventName: event.name,
        submitter: submitter?.name ?? "Unknown submitter",
        entity: entity?.name ?? "Unknown entity",
        date: event.date,
        stepNumber: step.step_number,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Approvals
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
          Pending approvals
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          Review the items currently waiting on your step in the approval
          chain.
        </p>
      </section>

      {queueItems.length > 0 ? (
        <section className="space-y-4">
          {queueItems.map((approval) => (
            <ApprovalQueueItem approval={approval} key={approval.eventId} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No pending approvals"
          description="There are no events currently waiting on your approval step."
        />
      )}
    </div>
  );
}
