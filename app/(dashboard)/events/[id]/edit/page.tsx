import { notFound } from "next/navigation";
import { EventSubmissionForm } from "@/components/events/event-submission-form";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: facilities }, { data: event }] = await Promise.all([
    supabase.from("users").select("entity_id, role").eq("id", user.id).maybeSingle(),
    supabase.from("facilities").select("id, name").eq("active", true).order("name"),
    supabase
      .from("events")
      .select(
        `
          id,
          submitter_id,
          name,
          date,
          start_time,
          end_time,
          facility_id,
          facility_notes,
          description,
          audience,
          grade_level,
          expected_attendance,
          staffing_needs,
          marketing_needed,
          status,
          marketing_request:marketing_requests(
            type,
            details,
            target_audience,
            priority,
            file_url
          )
        `,
      )
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  if (profile?.role === "viewer") {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Edit event
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Event editing
          </h1>
        </section>

        <EmptyState
          title="Read-only access"
          description="This Maydan account can view events but cannot edit them."
        />
      </div>
    );
  }

  if (!event || event.submitter_id !== user.id) {
    notFound();
  }

  if (
    event.status !== "draft" &&
    event.status !== "needs_revision" &&
    event.status !== "pending"
  ) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Edit event
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Event editing
          </h1>
        </section>

        <EmptyState
          title="Editing unavailable"
          description="Only draft, pending, or needs revision events can be edited. Approved events stay locked to preserve the final record."
        />
      </div>
    );
  }

  const { data: entity } = profile?.entity_id
    ? await supabase
        .from("entities")
        .select("id, name")
        .eq("id", profile.entity_id)
        .maybeSingle()
    : { data: null };

  if (!profile?.entity_id || !entity) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Edit event
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Event editing
          </h1>
        </section>

        <EmptyState
          title="Entity assignment required"
          description="Ask an admin to assign your Maydan account to an entity before editing this event."
        />
      </div>
    );
  }

  const marketingRequest = Array.isArray(event.marketing_request)
    ? event.marketing_request[0]
    : event.marketing_request;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Edit event
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
          {event.status === "draft"
            ? "Edit draft event"
            : event.status === "pending"
              ? "Edit pending event"
              : "Revise event request"}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          {event.status === "draft"
            ? "Update the draft and either keep it saved or submit it into the approval chain."
            : event.status === "pending"
              ? "Save changes to this pending event and Maydan will restart the approval chain from Step 1 automatically."
              : "Make the requested changes, save the updated event, then return to the event page to resubmit it."}
        </p>
      </section>

      <EventSubmissionForm
        entityName={entity.name}
        facilities={(facilities ?? []).map((facility) => ({
          id: facility.id,
          name: facility.name,
        }))}
        mode="edit"
        eventId={event.id}
        eventStatus={event.status ?? "draft"}
        existingMarketingFileUrl={marketingRequest?.file_url ?? null}
        initialValues={{
          name: event.name,
          date: event.date,
          startTime: event.start_time,
          endTime: event.end_time,
          facilityId: event.facility_id ?? "",
          facilityNotes: event.facility_notes ?? undefined,
          description: event.description ?? "",
          audience: event.audience ?? [],
          gradeLevel: event.grade_level ?? "HS",
          expectedAttendance: event.expected_attendance ?? undefined,
          staffingNeeds: event.staffing_needs ?? undefined,
          marketingNeeded: Boolean(event.marketing_needed || marketingRequest),
          marketingType: marketingRequest?.type as
            | "Social Media"
            | "Flyer"
            | "Video"
            | "Slide Deck"
            | "Other"
            | undefined,
          marketingDetails: marketingRequest?.details ?? undefined,
          marketingAudience: marketingRequest?.target_audience ?? undefined,
          marketingPriority:
            (marketingRequest?.priority as "standard" | "urgent" | undefined) ??
            "standard",
        }}
      />
    </div>
  );
}
