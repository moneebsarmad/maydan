"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ActionKind = "approve" | "reject" | "suggest" | null;

export function ApprovalActionShell() {
  const [action, setAction] = useState<ActionKind>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const [confirmedAction, setConfirmedAction] = useState<ActionKind>(null);

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      {confirmedAction ? (
        <AppToast
          variant={confirmedAction === "approve" ? "success" : "info"}
          title="Action previewed"
          description="This static Phase 2 shell captures the UI flow. Workflow wiring begins in Phase 5."
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

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
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
          />
        </div>
      ) : null}

      {showAlternative ? (
        <div className="grid gap-4 rounded-3xl border border-sky-200 bg-sky-50/70 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="suggested-date">Suggested date</Label>
            <Input id="suggested-date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggested-time">Suggested time</Label>
            <Input id="suggested-time" type="time" />
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        className="w-full justify-center"
        onClick={() => setAction(action ?? "approve")}
      >
        Confirm action
      </Button>

      <ConfirmModal
        open={action !== null}
        title="Confirm approval action"
        description="This reusable modal previews the confirmation step required before destructive or state-changing actions."
        confirmLabel="Confirm"
        onCancel={() => setAction(null)}
        onConfirm={() => {
          setConfirmedAction(action);
          setAction(null);
        }}
      />
    </div>
  );
}
