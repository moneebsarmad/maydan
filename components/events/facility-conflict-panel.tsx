"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { flagFacilityConflict } from "@/app/(dashboard)/approvals/actions";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FacilityConflictPanelProps {
  eventId: string;
  existingNotes?: string | null;
}

export function FacilityConflictPanel({
  eventId,
  existingNotes,
}: FacilityConflictPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-6 shadow-sm">
      {toast ? (
        <div className="mb-4">
          <AppToast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
          />
        </div>
      ) : null}

      <p className="text-xs uppercase tracking-[0.24em] text-amber-800">
        Facilities action
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-amber-950">
        {existingNotes ? "Update conflict note" : "Flag facility conflict"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-amber-900">
        Save the facilities conflict note and notify the submitter plus the
        current approver.
      </p>

      <Textarea
        className="mt-4 min-h-32 border-amber-300 bg-white text-slate-950"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Describe the facility conflict and the constraint that needs attention."
      />

      <Button
        className="mt-4"
        type="button"
        disabled={isPending || !notes.trim()}
        onClick={() => {
          startTransition(async () => {
            const result = await flagFacilityConflict({
              eventId,
              notes,
            });

            if (!result.success) {
              setToast({
                variant: "error",
                title: "Conflict not saved",
                description: result.error,
              });
              return;
            }

            setToast({
              variant: "info",
              title: "Conflict saved",
              description: result.message,
            });
            router.refresh();
          });
        }}
      >
        {isPending
          ? <LoadingLabel label="Saving..." />
          : existingNotes
            ? "Update conflict note"
            : "Flag conflict"}
      </Button>
    </div>
  );
}
