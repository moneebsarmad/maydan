import Link from "next/link";
import { CalendarDays, ChevronRight, User2 } from "lucide-react";

interface ApprovalQueueItemProps {
  approval: {
    eventId: string;
    eventName: string;
    submitter: string;
    entity: string;
    date: string;
    stepNumber: number;
  };
}

export function ApprovalQueueItem({ approval }: ApprovalQueueItemProps) {
  return (
    <Link
      href={`/approvals/${approval.eventId}`}
      prefetch={false}
      className="flex flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          {approval.entity} · Step {approval.stepNumber}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {approval.eventName}
        </h3>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-600">
          <span className="inline-flex items-center gap-2">
            <User2 className="h-4 w-4 text-amber-700" />
            {approval.submitter}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-700" />
            {approval.date}
          </span>
        </div>
      </div>
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
        Review approval
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
