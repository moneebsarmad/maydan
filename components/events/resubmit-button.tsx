"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resubmitEvent } from "@/app/(dashboard)/approvals/actions";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";

interface ResubmitButtonProps {
  eventId: string;
}

export function ResubmitButton({ eventId }: ResubmitButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  return (
    <div className="space-y-3">
      {toast ? (
        <AppToast
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      ) : null}

      <Button
        type="button"
        onClick={() => {
          startTransition(async () => {
            const result = await resubmitEvent({ eventId });

            if (!result.success) {
              setToast({
                variant: "error",
                title: "Resubmission failed",
                description: result.error,
              });
              return;
            }

            setToast({
              variant: "success",
              title: "Event resubmitted",
              description: result.message,
            });
            router.refresh();
          });
        }}
      >
        {isPending ? <LoadingLabel label="Resubmitting..." /> : "Resubmit event"}
      </Button>
    </div>
  );
}
