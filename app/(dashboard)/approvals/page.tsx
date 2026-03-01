import { ApprovalQueueItem } from "@/components/approvals/approval-queue-item";
import { EmptyState } from "@/components/shared/empty-state";
import { approvalQueue } from "@/lib/utils/demo-data";

export default function ApprovalsPage() {
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
          This queue shell previews the approver view with event, submitter,
          entity, and date at a glance.
        </p>
      </section>

      {approvalQueue.length > 0 ? (
        <section className="space-y-4">
          {approvalQueue.map((approval) => (
            <ApprovalQueueItem approval={approval} key={approval.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No pending approvals"
          description="Approvers will see queued items here once event routing is wired in later phases."
        />
      )}
    </div>
  );
}
