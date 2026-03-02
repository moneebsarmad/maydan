"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  sendMarketingCommentEmail,
  sendMarketingRequestEmail,
} from "@/lib/resend/emails";
import {
  getEventSubmittedNotifications,
  getMarketingCommentNotifications,
  getMarketingRequestNotifications,
} from "@/lib/notification-payloads";
import { createClient } from "@/lib/supabase/server";
import {
  runNonCriticalEffect,
  settleNonCriticalEffects,
} from "@/lib/utils/non-critical";
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

interface MarketingCommentActionSuccess {
  success: true;
  message: string;
}

interface MarketingCommentActionFailure {
  success: false;
  error: string;
}

export type MarketingCommentActionResult =
  | MarketingCommentActionSuccess
  | MarketingCommentActionFailure;

const marketingCommentSchema = z.object({
  eventId: z.string().uuid("Event not found."),
  marketingRequestId: z.string().uuid("Marketing request not found."),
  comment: z.string().trim().min(1, "A marketing note is required."),
});

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

    await runNonCriticalEffect(`submit event notifications:${eventId}`, async () => {
      await settleNonCriticalEffects(
        `submit event in-app notifications:${eventId}`,
        getEventSubmittedNotifications({
          eventId,
          eventName: parsedValues.data.name,
          firstApproverId: approvalChain.approverIds[0],
          facilitiesDirectorId: approvalChain.ccUserId,
        }).map((notification) =>
          createNotification(
            notification.userId,
            notification.eventId,
            notification.message,
          ),
        ),
      );

      const recipients = await getNotificationRecipients(querySupabase, [
        approvalChain.approverIds[0],
        approvalChain.ccUserId,
      ]);

      await settleNonCriticalEffects(`submit event emails:${eventId}`, [
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
    });

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

      await runNonCriticalEffect(
        `submit event marketing side effects:${eventId}`,
        async () => {
          const prStaffRecipients = await getPRStaffRecipients(querySupabase);

          await settleNonCriticalEffects(
            `submit event marketing notifications:${eventId}`,
            getMarketingRequestNotifications({
              eventId,
              eventName: parsedValues.data.name,
              prStaffIds: prStaffRecipients.map((recipient) => recipient.id),
            }).map((notification) =>
              createNotification(
                notification.userId,
                notification.eventId,
                notification.message,
              ),
            ),
          );

          await settleNonCriticalEffects(
            `submit event marketing emails:${eventId}`,
            prStaffRecipients.map((recipient) =>
              sendMarketingRequestEmail(
                recipient.email,
                parsedValues.data.name,
                parsedValues.data.marketingDetails ?? "",
                eventId,
              ),
            ),
          );
        },
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

export async function addMarketingRequestComment(input: {
  eventId: string;
  marketingRequestId: string;
  comment: string;
}): Promise<MarketingCommentActionResult> {
  const parsedInput = marketingCommentSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.error.issues[0]?.message ?? "Marketing note is invalid.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveMarketingCommentActor(supabase);
    const { data: marketingRequest, error: marketingRequestError } = await supabase
      .from("marketing_requests")
      .select("id, event_id")
      .eq("id", parsedInput.data.marketingRequestId)
      .eq("event_id", parsedInput.data.eventId)
      .maybeSingle();

    if (marketingRequestError) {
      throw new Error(marketingRequestError.message);
    }

    if (!marketingRequest) {
      throw new Error("Marketing request could not be found.");
    }

    const { error: commentError } = await supabase
      .from("marketing_request_comments")
      .insert({
        marketing_request_id: marketingRequest.id,
        author_id: actor.id,
        comment: parsedInput.data.comment,
      });

    if (commentError) {
      throw new Error(commentError.message);
    }

    const event = await getEventForMarketingCommentNotification(
      supabase,
      parsedInput.data.eventId,
    );

    await runNonCriticalEffect(
      `marketing comment notifications:${parsedInput.data.eventId}`,
      async () => {
        await settleNonCriticalEffects(
          `marketing comment in-app notifications:${parsedInput.data.eventId}`,
          getMarketingCommentNotifications({
            eventId: parsedInput.data.eventId,
            eventName: event.name,
            submitterId: event.submitter.id,
            commenterName: actor.name,
          }).map((notification) =>
            createNotification(
              notification.userId,
              notification.eventId,
              notification.message,
            ),
          ),
        );

        await settleNonCriticalEffects(
          `marketing comment email notifications:${parsedInput.data.eventId}`,
          event.submitter.email
            ? [
                sendMarketingCommentEmail(
                  event.submitter.email,
                  event.name,
                  actor.name,
                  parsedInput.data.comment,
                  parsedInput.data.eventId,
                ),
              ]
            : [],
        );
      },
    );

    revalidatePhaseFourPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Marketing note saved. The request owner has been notified.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the marketing note right now.",
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
    .select("id, role, active, entity_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.active) {
    throw new Error("Your Maydan account is inactive.");
  }

  if (profile.role === "viewer") {
    throw new Error("This Maydan account has read-only access.");
  }

  if (!profile.entity_id) {
    throw new Error("Your account must be assigned to an entity before submitting.");
  }

  return {
    id: profile.id,
    entityId: profile.entity_id,
  };
}

async function getActiveMarketingCommentActor(
  supabase: ReturnType<typeof createClient>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, name, role, title, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.active) {
    throw new Error("Your Maydan account is inactive.");
  }

  if (profile.role !== "admin" && profile.title !== "PR Staff") {
    throw new Error("Only admin and PR Staff can leave marketing notes.");
  }

  return {
    id: profile.id,
    name: profile.name,
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

async function getEventForMarketingCommentNotification(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id,
        name,
        submitter:users!events_submitter_id_fkey(id, email)
      `,
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Event could not be found.");
  }

  const submitter = Array.isArray(data.submitter) ? data.submitter[0] : data.submitter;

  if (!submitter?.id) {
    throw new Error("Event submitter could not be resolved.");
  }

  return {
    id: data.id,
    name: data.name,
    submitter: {
      id: submitter.id,
      email: submitter.email ?? null,
    },
  };
}
