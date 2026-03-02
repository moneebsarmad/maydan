import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalChainProgress } from "@/components/approvals/approval-chain-progress";
import { FacilityConflictCard } from "@/components/events/facility-conflict-card";
import { FacilityConflictPanel } from "@/components/events/facility-conflict-panel";
import { MarketingRequestComments } from "@/components/events/marketing-request-comments";
import { ResubmitButton } from "@/components/events/resubmit-button";
import { StatusBadge } from "@/components/events/status-badge";
import { AppToast } from "@/components/shared/toast";
import { getShellUser } from "@/lib/supabase/get-shell-user";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus } from "@/types";

interface EventDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    upload?: string;
    updated?: string;
  };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  const user = await getShellUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      `
        id,
        name,
        submitter_id,
        date,
        start_time,
        end_time,
        facility_notes,
        description,
        audience,
        grade_level,
        expected_attendance,
        staffing_needs,
        marketing_needed,
        status,
        current_step,
        entity:entities!events_entity_id_fkey(name, type),
        facility:facilities!events_facility_id_fkey(name)
      `,
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: approvalSteps } = await supabase
    .from("approval_steps")
    .select(
      `
        step_number,
        status,
        reason,
        suggested_date,
        suggested_start_time,
        approver:users!approval_steps_approver_id_fkey(name, title)
      `,
    )
    .eq("event_id", params.id)
    .order("step_number", { ascending: true });

  const { data: marketingRequest } = await supabase
    .from("marketing_requests")
    .select("id, type, details, target_audience, priority, file_url")
    .eq("event_id", params.id)
    .maybeSingle();
  const { data: marketingComments } = marketingRequest
    ? await supabase
        .from("marketing_request_comments")
        .select(
          `
            id,
            comment,
            created_at,
            author:users!marketing_request_comments_author_id_fkey(name, title)
          `,
        )
        .eq("marketing_request_id", marketingRequest.id)
        .order("created_at", { ascending: true })
    : { data: [] };
  const { data: facilityConflict } = await supabase
    .from("facility_conflicts")
    .select("notes, created_at")
    .eq("event_id", params.id)
    .maybeSingle();

  const entity = Array.isArray(event.entity) ? event.entity[0] : event.entity;
  const facility = Array.isArray(event.facility) ? event.facility[0] : event.facility;
  const steps = (approvalSteps ?? []).map((step) => {
    const approver = Array.isArray(step.approver) ? step.approver[0] : step.approver;

    return {
      step: step.step_number,
      label: approver?.title ?? approver?.name ?? `Approver ${step.step_number}`,
      status: (step.status ?? "pending") as ApprovalStatus,
    };
  });
  const rejectionReason =
    approvalSteps?.find((step) => step.status === "rejected")?.reason ?? null;
  const alternativeSuggestion = approvalSteps?.find(
    (step) => step.status === "rejected" && step.suggested_date && step.suggested_start_time,
  );
  const canResubmit =
    event.status === "needs_revision" && event.submitter_id === user.id;
  const canEditEvent =
    event.submitter_id === user.id &&
    (event.status === "draft" ||
      event.status === "needs_revision" ||
      event.status === "pending");
  const canFlagFacilityConflict =
    event.status === "pending" &&
    (user.role === "admin" || user.title === "Facilities Director");
  const canCommentOnMarketingRequest =
    Boolean(marketingRequest) &&
    (user.role === "admin" || user.title === "PR Staff");
  const normalizedMarketingComments = (marketingComments ?? []).map((comment) => {
    const author = Array.isArray(comment.author) ? comment.author[0] : comment.author;

    return {
      id: comment.id,
      authorName: author?.name ?? "Maydan staff",
      authorTitle: author?.title ?? null,
      comment: comment.comment,
      createdAt: comment.created_at,
    };
  });

  return (
    <div className="space-y-6">
      {searchParams?.upload === "failed" ? (
        <AppToast
          variant="error"
          title="Attachment upload failed"
          description="The event changes were saved successfully, but the marketing file upload did not complete. You can continue without the attachment for now."
        />
      ) : null}
      {searchParams?.updated === "saved" ? (
        <AppToast
          variant="success"
          title="Event updated"
          description="Your event changes were saved successfully."
        />
      ) : null}
      {searchParams?.updated === "restarted" ? (
        <AppToast
          variant="success"
          title="Pending event updated"
          description="Your changes were saved and the approval chain restarted from Step 1."
        />
      ) : null}
      {searchParams?.updated === "submitted" ? (
        <AppToast
          variant="success"
          title="Draft submitted"
          description="Your updated draft has entered the approval chain."
        />
      ) : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              {entity?.name ?? "Unknown entity"}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              {event.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              {event.description ?? "No description provided."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={event.status ?? "draft"} />
            {canEditEvent ? (
              <Link
                href={`/events/${event.id}/edit`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-stone-400 hover:bg-stone-50"
              >
                Edit event
              </Link>
            ) : null}
            {canResubmit ? <ResubmitButton eventId={event.id} /> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Date" value={event.date} />
          <Stat label="Time" value={`${event.start_time} - ${event.end_time}`} />
          <Stat label="Facility" value={facility?.name ?? "Unassigned facility"} />
          <Stat
            label="Attendance"
            value={event.expected_attendance ? `${event.expected_attendance}` : "Not set"}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              Submission details
            </h2>
            <dl className="mt-5 grid gap-5 md:grid-cols-2">
              <DetailItem
                label="Target audience"
                value={(event.audience ?? []).join(", ") || "Not specified"}
              />
              <DetailItem
                label="Grade level"
                value={event.grade_level ?? "Not specified"}
              />
              <DetailItem
                label="Staffing needs"
                value={event.staffing_needs ?? "No staffing needs listed"}
              />
              <DetailItem
                label="Facility notes"
                value={event.facility_notes ?? "No facility notes provided"}
              />
            </dl>
          </div>

          {facilityConflict ? (
            <FacilityConflictCard
              notes={facilityConflict.notes}
              createdAt={facilityConflict.created_at}
            />
          ) : null}

          {rejectionReason ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
                Rejection reason
              </p>
              <p className="mt-3 text-base leading-7 text-rose-950">
                {rejectionReason}
              </p>
            </div>
          ) : null}

          {alternativeSuggestion ? (
            <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-700">
                Suggested alternative
              </p>
              <p className="mt-3 text-base leading-7 text-slate-950">
                {alternativeSuggestion.suggested_date} at{" "}
                {alternativeSuggestion.suggested_start_time}
              </p>
            </div>
          ) : null}

          {marketingRequest ? (
            <>
              <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-700">
                  Marketing request
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {marketingRequest.type}
                </h2>
                <dl className="mt-5 grid gap-5 md:grid-cols-2">
                  <DetailItem
                    label="Request details"
                    value={marketingRequest.details ?? "No details provided"}
                  />
                  <DetailItem
                    label="Target audience"
                    value={marketingRequest.target_audience ?? "Not specified"}
                  />
                  <DetailItem
                    label="Priority"
                    value={marketingRequest.priority ?? "standard"}
                  />
                  <DetailItem
                    label="Attachment"
                    value={marketingRequest.file_url ?? "No file attached"}
                  />
                </dl>
              </div>

              <MarketingRequestComments
                eventId={event.id}
                marketingRequestId={marketingRequest.id}
                comments={normalizedMarketingComments}
                canComment={canCommentOnMarketingRequest}
              />
            </>
          ) : null}
        </section>

        <div className="space-y-6">
          <ApprovalChainProgress steps={steps} />
          {canFlagFacilityConflict ? (
            <FacilityConflictPanel
              eventId={event.id}
              existingNotes={facilityConflict?.notes}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
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
