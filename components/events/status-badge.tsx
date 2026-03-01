import { cn } from "@/lib/utils";
import type { EventStatus } from "@/types";

interface StatusBadgeProps {
  status: EventStatus;
}

const statusStyles: Record<EventStatus, string> = {
  draft: "bg-stone-100 text-stone-700",
  pending: "bg-amber-100 text-amber-950",
  needs_revision: "bg-rose-100 text-rose-950",
  approved: "bg-emerald-100 text-emerald-950",
  cancelled: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        statusStyles[status],
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
