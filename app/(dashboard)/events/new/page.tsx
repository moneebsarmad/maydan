import { EmptyState } from "@/components/shared/empty-state";
import { EventSubmissionForm } from "@/components/events/event-submission-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("entity_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, name")
    .eq("active", true)
    .order("name");

  const { data: entity } = profile?.entity_id
    ? await supabase
        .from("entities")
        .select("id, name")
        .eq("id", profile.entity_id)
        .maybeSingle()
    : { data: null };

  if (profile?.role === "viewer") {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            New event
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Event submission form
          </h1>
        </section>

        <EmptyState
          title="Read-only access"
          description="This Maydan account can view events but cannot submit them."
        />
      </div>
    );
  }

  if (!profile?.entity_id || !entity) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            New event
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Event submission form
          </h1>
        </section>

        <EmptyState
          title="Entity assignment required"
          description="Event routing depends on the submitter's entity. Ask an admin to assign your Maydan account to an entity before submitting."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          New event
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
          Event submission form
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Submit a Maydan event on behalf of your assigned entity. Routing is
          built automatically from your entity affiliation and the event grade
          level.
        </p>
      </section>

      <EventSubmissionForm
        entityName={entity.name}
        facilities={(facilities ?? []).map((facility) => ({
          id: facility.id,
          name: facility.name,
        }))}
      />
    </div>
  );
}
