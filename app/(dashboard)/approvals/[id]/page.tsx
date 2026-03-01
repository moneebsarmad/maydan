import { notFound } from "next/navigation";
import { ApprovalActionShell } from "@/components/approvals/approval-action-shell";
import { ApprovalChainProgress } from "@/components/approvals/approval-chain-progress";
import { StatusBadge } from "@/components/events/status-badge";
import { approvalQueue, demoEvents } from "@/lib/utils/demo-data";

interface ApprovalDetailPageProps {
  params: {
    id: string;
  };
}

export default function ApprovalDetailPage({
  params,
}: ApprovalDetailPageProps) {
  const queueItem = approvalQueue.find((item) => item.id === params.id);
  const event = demoEvents.find((item) => item.id === queueItem?.eventId);

  if (!queueItem || !event) {
    notFound();
  }

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
              {event.description}
            </p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              Event details
            </h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailItem label="Submitter" value={queueItem.submitter} />
              <DetailItem label="Entity" value={event.entity} />
              <DetailItem label="Date" value={event.date} />
              <DetailItem
                label="Time"
                value={`${event.startTime} - ${event.endTime}`}
              />
              <DetailItem label="Facility" value={event.facility} />
              <DetailItem label="Grade level" value={event.gradeLevel} />
            </dl>
          </div>

          <ApprovalChainProgress steps={event.approvalChain} />
        </section>

        <ApprovalActionShell />
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
