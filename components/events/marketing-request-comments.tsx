"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addMarketingRequestComment } from "@/app/(dashboard)/events/actions";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MarketingRequestCommentItem {
  id: string;
  authorName: string;
  authorTitle: string | null;
  comment: string;
  createdAt: string | null;
}

interface MarketingRequestCommentsProps {
  eventId: string;
  marketingRequestId: string;
  comments: MarketingRequestCommentItem[];
  canComment: boolean;
}

export function MarketingRequestComments({
  eventId,
  marketingRequestId,
  comments,
  canComment,
}: MarketingRequestCommentsProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  return (
    <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-6 shadow-sm">
      {toast ? (
        <div className="mb-4">
          <AppToast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
          />
        </div>
      ) : null}

      <p className="text-xs uppercase tracking-[0.24em] text-sky-700">
        Marketing notes
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
        Request follow-up
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Use this thread to document marketing follow-up. New notes notify the
        original requester.
      </p>

      <div className="mt-5 space-y-3">
        {comments.length > 0 ? (
          comments.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-sky-100 bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {item.authorName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                    {item.authorTitle ?? "Maydan staff"}
                  </p>
                </div>
                <p className="text-xs font-medium text-stone-500">
                  {item.createdAt
                    ? formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })
                    : "Just now"}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {item.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white/80 px-4 py-5 text-sm text-stone-600">
            No marketing notes yet.
          </div>
        )}
      </div>

      {canComment ? (
        <div className="mt-5 space-y-4">
          <Textarea
            className="min-h-28 border-sky-200 bg-white text-slate-950"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a marketing note for documentation, follow-up, or next steps."
          />
          <Button
            type="button"
            disabled={isPending || !comment.trim()}
            onClick={() => {
              startTransition(async () => {
                const result = await addMarketingRequestComment({
                  eventId,
                  marketingRequestId,
                  comment,
                });

                if (!result.success) {
                  setToast({
                    variant: "error",
                    title: "Note not saved",
                    description: result.error,
                  });
                  return;
                }

                setComment("");
                setToast({
                  variant: "success",
                  title: "Note saved",
                  description: result.message,
                });
                router.refresh();
              });
            }}
          >
            {isPending ? <LoadingLabel label="Saving note..." /> : "Add marketing note"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
