"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/(dashboard)/notifications/actions";
import {
  buildApprovalChain,
  createApprovalRoutingDependencies,
  createSupabaseApprovalRoutingRepository,
  type SupabaseLike,
} from "@/lib/routing/approval-router";
import {
  sendApprovalRequestEmail,
  sendFacilitiesCcEmail,
  sendMarketingRequestEmail,
} from "@/lib/resend/emails";
import {
  getEventSubmittedNotifications,
  getMarketingRequestNotifications,
} from "@/lib/notification-payloads";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema, type EventFormValues } from "@/lib/utils/event-form";
import type { EntityType, GradeLevel } from "@/types";

interface EventActionSuccess {
  success: true;
  eventId: string;
}

interface EventActionFailure {
  success: false;
  error: string;
}

export type EventActionResult = EventActionSuccess | EventActionFailure;

export async function submitEvent(
  values: EventFormValues,
): Promise<EventActionResult> {
  const parsedValues = eventFormSchema.safeParse(values);

  if (!parsedValues.success) {
    return {
      success: false,
      error: parsedValues.error.issues[0]?.message ?? "Event data is invalid.",
    };
  }

  const supabase = createClient();
  const querySupabase = supabase as any;
  const profile = await getActiveProfileWithEntity(supabase);

  try {
    const entity = await getEntityForSubmission(querySupabase, profile.entityId);
    const facility = await getFacilityForSubmission(
      querySupabase,
      parsedValues.data.facilityId,
    );
    validateFacilityNotes(facility.name, parsedValues.data.facilityNotes);
    const routingDependencies = createApprovalRoutingDependencies(
      createSupabaseApprovalRoutingRepository(querySupabase as SupabaseLike),
    );
    const approvalChain = await buildApprovalChain(
      entity.type,
      entity.id,
      parsedValues.data.gradeLevel,
      routingDependencies,
    );
    const eventId = crypto.randomUUID();

    const { error: eventError } = await supabase
      .from("events")
      .insert({
        id: eventId,
        name: parsedValues.data.name,
        date: parsedValues.data.date,
        start_time: parsedValues.data.startTime,
        end_time: parsedValues.data.endTime,
        facility_id: parsedValues.data.facilityId,
        facility_notes: parsedValues.data.facilityNotes ?? null,
        description: parsedValues.data.description,
        audience: parsedValues.data.audience,
        grade_level: parsedValues.data.gradeLevel,
        expected_attendance: parsedValues.data.expectedAttendance ?? null,
        staffing_needs: parsedValues.data.staffingNeeds ?? null,
        marketing_needed: parsedValues.data.marketingNeeded,
        status: "pending",
        submitter_id: profile.id,
        entity_id: entity.id,
        current_step: 1,
      });

    if (eventError) {
      throw new Error(eventError?.message ?? "Unable to create the event.");
    }

    const approvalStepRows = approvalChain.approverIds.map((approverId, index) => ({
      event_id: eventId,
      approver_id: approverId,
      step_number: index + 1,
      status: "pending" as const,
    }));

    const { error: stepsError } = await supabase
      .from("approval_steps")
      .insert(approvalStepRows);

    if (stepsError) {
      throw new Error(stepsError.message);
    }

    for (const notification of getEventSubmittedNotifications({
      eventId,
      eventName: parsedValues.data.name,
      firstApproverId: approvalChain.approverIds[0],
      facilitiesDirectorId: approvalChain.ccUserId,
    })) {
      await createNotification(
        notification.userId,
        notification.eventId,
        notification.message,
      );
    }

    const recipients = await getNotificationRecipients(querySupabase, [
      approvalChain.approverIds[0],
      approvalChain.ccUserId,
    ]);

    // In-app notifications are the primary Phase 4 delivery path.
    await Promise.allSettled([
      recipients.stepOneRecipient?.email
        ? sendApprovalRequestEmail(
            recipients.stepOneRecipient.email,
            parsedValues.data.name,
            eventId,
          )
        : Promise.resolve(null),
      recipients.facilitiesRecipient?.email
        ? sendFacilitiesCcEmail(
            recipients.facilitiesRecipient.email,
            parsedValues.data.name,
            eventId,
          )
        : Promise.resolve(null),
    ]);

    if (parsedValues.data.marketingNeeded) {
      const { error: marketingError } = await supabase
        .from("marketing_requests")
        .insert({
          event_id: eventId,
          type: parsedValues.data.marketingType!,
          details: parsedValues.data.marketingDetails ?? null,
          target_audience: parsedValues.data.marketingAudience ?? null,
          priority: parsedValues.data.marketingPriority ?? "standard",
          file_url: null,
        });

      if (marketingError) {
        throw new Error(marketingError.message);
      }

      const prStaffRecipients = await getPRStaffRecipients(querySupabase);

      for (const notification of getMarketingRequestNotifications({
        eventId,
        eventName: parsedValues.data.name,
        prStaffIds: prStaffRecipients.map((recipient) => recipient.id),
      })) {
        await createNotification(
          notification.userId,
          notification.eventId,
          notification.message,
        );
      }

      await Promise.allSettled(
        prStaffRecipients.map((recipient) =>
          sendMarketingRequestEmail(
            recipient.email,
            parsedValues.data.name,
            parsedValues.data.marketingDetails ?? "",
            eventId,
          ),
        ),
      );
    }

    revalidatePhaseFourPaths(eventId);

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to submit the event right now.",
    };
  }
}

export async function saveDraft(
  values: EventFormValues,
): Promise<EventActionResult> {
  const parsedValues = eventFormSchema.safeParse(values);

  if (!parsedValues.success) {
    return {
      success: false,
      error: parsedValues.error.issues[0]?.message ?? "Event data is invalid.",
    };
  }

  const supabase = createClient();
  const querySupabase = supabase as any;
  const profile = await getActiveProfileWithEntity(supabase);

  try {
    const facility = await getFacilityForSubmission(
      querySupabase,
      parsedValues.data.facilityId,
    );
    validateFacilityNotes(facility.name, parsedValues.data.facilityNotes);
    const eventId = crypto.randomUUID();

    const { error: eventError } = await supabase
      .from("events")
      .insert({
        id: eventId,
        name: parsedValues.data.name,
        date: parsedValues.data.date,
        start_time: parsedValues.data.startTime,
        end_time: parsedValues.data.endTime,
        facility_id: parsedValues.data.facilityId,
        facility_notes: parsedValues.data.facilityNotes ?? null,
        description: parsedValues.data.description,
        audience: parsedValues.data.audience,
        grade_level: parsedValues.data.gradeLevel,
        expected_attendance: parsedValues.data.expectedAttendance ?? null,
        staffing_needs: parsedValues.data.staffingNeeds ?? null,
        marketing_needed: parsedValues.data.marketingNeeded,
        status: "draft",
        submitter_id: profile.id,
        entity_id: profile.entityId,
        current_step: 1,
      });

    if (eventError) {
      throw new Error(eventError?.message ?? "Unable to save the draft.");
    }

    if (parsedValues.data.marketingNeeded) {
      const { error: marketingError } = await supabase
        .from("marketing_requests")
        .insert({
          event_id: eventId,
          type: parsedValues.data.marketingType!,
          details: parsedValues.data.marketingDetails ?? null,
          target_audience: parsedValues.data.marketingAudience ?? null,
          priority: parsedValues.data.marketingPriority ?? "standard",
          file_url: null,
        });

      if (marketingError) {
        throw new Error(marketingError.message);
      }
    }

    revalidatePhaseFourPaths(eventId);

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the draft right now.",
    };
  }
}

async function getActiveProfileWithEntity(
  supabase: ReturnType<typeof createClient>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, active, entity_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.active) {
    throw new Error("Your Maydan account is inactive.");
  }

  if (!profile.entity_id) {
    throw new Error("Your account must be assigned to an entity before submitting.");
  }

  return {
    id: profile.id,
    entityId: profile.entity_id,
  };
}

async function getEntityForSubmission(supabase: any, entityId: string) {
  const { data: entity, error } = await supabase
    .from("entities")
    .select("id, type")
    .eq("id", entityId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!entity) {
    throw new Error("Submitting entity could not be found.");
  }

  return entity as {
    id: string;
    type: EntityType;
    grade_level?: GradeLevel | null;
  };
}

async function getFacilityForSubmission(supabase: any, facilityId: string) {
  const { data: facility, error } = await supabase
    .from("facilities")
    .select("id, name")
    .eq("id", facilityId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!facility) {
    throw new Error("Selected facility could not be found.");
  }

  return facility as {
    id: string;
    name: string;
  };
}

function validateFacilityNotes(
  facilityName: string,
  facilityNotes: string | undefined,
) {
  if (facilityName === "Classroom" && !facilityNotes?.trim()) {
    throw new Error("Classroom events must specify a room.");
  }
}

function revalidatePhaseFourPaths(eventId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/approvals");
}

async function getNotificationRecipients(supabase: any, userIds: string[]) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, title")
    .in("id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  const recipients = (data ?? []) as Array<{
    id: string;
    email: string;
    title: string | null;
  }>;

  return {
    stepOneRecipient: recipients.find((recipient) => recipient.id === userIds[0]) ?? null,
    facilitiesRecipient:
      recipients.find((recipient) => recipient.id === userIds[1]) ?? null,
  };
}

async function getPRStaffRecipients(supabase: any) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("title", "PR Staff")
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{
    id: string;
    email: string;
  }>;
}
