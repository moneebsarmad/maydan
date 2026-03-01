"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveStep,
  rejectStep,
  suggestAlternative,
} from "@/app/(dashboard)/approvals/actions";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ActionKind = "approve" | "reject" | "suggest" | null;

interface ApprovalActionShellProps {
  eventId: string;
  canAct: boolean;
}

export function ApprovalActionShell({
  eventId,
  canAct,
}: ApprovalActionShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<ActionKind>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedTime, setSuggestedTime] = useState("");
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const confirmDisabled =
    !action ||
    isPending ||
    (action === "reject" && !rejectReason.trim()) ||
    (action === "suggest" && (!suggestedDate || !suggestedTime));

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      {toast ? (
        <AppToast
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Action panel
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Review and decide
        </h2>
      </div>

      {!canAct ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
          This event is not currently awaiting your action. You can review the
          details here, but only the assigned approver can progress this step.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={!canAct || isPending}
          onClick={() => {
            setAction("approve");
            setShowRejectReason(false);
            setShowAlternative(false);
          }}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canAct || isPending}
          onClick={() => {
            setShowRejectReason((current) => !current);
            setShowAlternative(false);
            setAction("reject");
          }}
        >
          Reject
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!canAct || isPending}
          onClick={() => {
            setShowAlternative((current) => !current);
            setShowRejectReason(false);
            setAction("suggest");
          }}
        >
          Suggest Alternative
        </Button>
      </div>

      {showRejectReason ? (
        <div className="space-y-2 rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <Label htmlFor="reject-reason">Reason for rejection</Label>
          <Textarea
            id="reject-reason"
            placeholder="Explain what needs to change before resubmission"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </div>
      ) : null}

      {showAlternative ? (
        <div className="grid gap-4 rounded-3xl border border-sky-200 bg-sky-50/70 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="suggested-date">Suggested date</Label>
            <Input
              id="suggested-date"
              type="date"
              value={suggestedDate}
              onChange={(event) => setSuggestedDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggested-time">Suggested time</Label>
            <Input
              id="suggested-time"
              type="time"
              value={suggestedTime}
              onChange={(event) => setSuggestedTime(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        className="w-full justify-center"
        disabled={confirmDisabled}
        onClick={() => setConfirmOpen(true)}
      >
        {isPending ? <LoadingLabel label="Saving..." /> : "Confirm action"}
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm approval action"
        description="This will immediately update the live approval chain and notify the next recipient."
        confirmLabel="Confirm"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!action) {
            return;
          }

          startTransition(async () => {
            let result;

            if (action === "approve") {
              result = await approveStep({ eventId });
            } else if (action === "reject") {
              result = await rejectStep({
                eventId,
                reason: rejectReason,
              });
            } else {
              result = await suggestAlternative({
                eventId,
                suggestedDate,
                suggestedTime,
              });
            }

            if (!result.success) {
              setToast({
                variant: "error",
                title: "Action failed",
                description: result.error,
              });
              setConfirmOpen(false);
              return;
            }

            setToast({
              variant: action === "approve" ? "success" : "info",
              title: "Workflow updated",
              description: result.message,
            });
            setConfirmOpen(false);
            setAction(null);
            setShowRejectReason(false);
            setShowAlternative(false);
            setRejectReason("");
            setSuggestedDate("");
            setSuggestedTime("");
            router.refresh();
          });
        }}
      />
    </div>
  );
}
