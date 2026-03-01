import { CheckCircle2, Circle, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalChainProgressProps {
  steps: Array<{
    step: number;
    label: string;
    status: "approved" | "pending" | "rejected";
  }>;
  ccLabel?: string;
}

export function ApprovalChainProgress({
  steps,
  ccLabel = "Facilities Director CC",
}: ApprovalChainProgressProps) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Approval chain
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            {steps.length > 0
              ? steps.map((step) => `Step ${step.step}`).join(" → ")
              : "Not submitted for approval"}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
          {ccLabel}
        </span>
      </div>

      {steps.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
          This event has not entered the approval chain yet.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
        {steps.map((step) => {
          const Icon =
            step.status === "approved"
              ? CheckCircle2
              : step.status === "rejected"
                ? OctagonAlert
                : Circle;

          return (
            <div className="flex items-center gap-4" key={step.step}>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border",
                  step.status === "approved" &&
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
                  step.status === "pending" &&
                    "border-stone-200 bg-stone-50 text-stone-500",
                  step.status === "rejected" &&
                    "border-rose-200 bg-rose-50 text-rose-700",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Step {step.step}
                </p>
                <p className="mt-1 font-semibold text-slate-950">{step.label}</p>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
