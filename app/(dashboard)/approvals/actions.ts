"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/app/(dashboard)/notifications/actions";
import {
  sendApprovalRequestEmail,
  sendAlternativeSuggestedEmail,
  sendEventApprovedEmail,
  sendEventRejectedEmail,
  sendFacilityConflictFlaggedEmail,
  sendFacilitiesNotificationEmail,
} from "@/lib/resend/emails";
import {
  getAlternativeNotifications,
  getFinalApprovalNotifications,
  getIntermediateApprovalNotifications,
  getRejectionNotifications,
  getResubmissionNotifications,
} from "@/lib/notification-payloads";
import { createClient } from "@/lib/supabase/server";
import {
  runNonCriticalEffect,
  settleNonCriticalEffects,
} from "@/lib/utils/non-critical";
import { syncApprovedEventToMicrosoftCalendar } from "@/lib/microsoft/calendar-sync";

const eventActionSchema = z.object({
  eventId: z.string().uuid("Event not found."),
});

const rejectionSchema = eventActionSchema.extend({
  reason: z.string().trim().min(1, "A rejection reason is required."),
});

const alternativeSchema = eventActionSchema.extend({
  suggestedDate: z.string().trim().min(1, "A suggested date is required."),
  suggestedTime: z.string().trim().min(1, "A suggested time is required."),
});

const facilityConflictSchema = eventActionSchema.extend({
  notes: z.string().trim().min(1, "A facility conflict note is required."),
});

interface ApprovalActionSuccess {
  success: true;
  message: string;
}

interface ApprovalActionFailure {
  success: false;
  error: string;
}

export type ApprovalActionResult =
  | ApprovalActionSuccess
  | ApprovalActionFailure;

export async function approveStep(input: {
  eventId: string;
}): Promise<ApprovalActionResult> {
  const parsedInput = eventActionSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.error.issues[0]?.message ?? "Invalid approval action.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveActor(supabase);
    const event = await getWorkflowEvent(supabase, parsedInput.data.eventId);
    const currentStep = await getCurrentPendingStep(
      supabase,
      parsedInput.data.eventId,
      event.currentStep,
    );

    if (currentStep.approverId !== actor.id) {
      throw new Error("This approval step is not assigned to you.");
    }

    const { error: stepError } = await supabase
      .from("approval_steps")
      .update({
        status: "approved",
        reason: null,
        suggested_date: null,
        suggested_start_time: null,
        actioned_at: new Date().toISOString(),
      })
      .eq("id", currentStep.id);

    if (stepError) {
      throw new Error(stepError.message);
    }

    const nextStep = await getStepByNumber(
      supabase,
      parsedInput.data.eventId,
      currentStep.stepNumber + 1,
    );

    if (nextStep) {
      const { error: eventError } = await supabase
        .from("events")
        .update({
          current_step: nextStep.stepNumber,
          status: "pending",
        })
        .eq("id", parsedInput.data.eventId);

      if (eventError) {
        throw new Error(eventError.message);
      }

      await runNonCriticalEffect(
        `approve step intermediate notifications:${parsedInput.data.eventId}`,
        async () => {
          await settleNonCriticalEffects(
            `approve step in-app notifications:${parsedInput.data.eventId}`,
            getIntermediateApprovalNotifications({
              eventId: parsedInput.data.eventId,
              eventName: event.name,
              nextApproverId: nextStep.approverId,
            }).map((notification) =>
              createNotification(
                notification.userId,
                notification.eventId,
                notification.message,
              ),
            ),
          );

          const nextApprover = await getUserContact(supabase, nextStep.approverId);

          await settleNonCriticalEffects(
            `approve step email notifications:${parsedInput.data.eventId}`,
            nextApprover?.email
              ? [
                  sendApprovalRequestEmail(
                    nextApprover.email,
                    event.name,
                    parsedInput.data.eventId,
                  ),
                ]
              : [],
          );
        },
      );

      revalidateWorkflowPaths(parsedInput.data.eventId);

      return {
        success: true,
        message: "Approval recorded and the next approver has been notified.",
      };
    }

    const { error: eventError } = await supabase
      .from("events")
      .update({
        current_step: currentStep.stepNumber + 1,
        status: "approved",
      })
      .eq("id", parsedInput.data.eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await runNonCriticalEffect(
      `final approval notifications:${parsedInput.data.eventId}`,
      async () => {
        await settleNonCriticalEffects(
          `final approval in-app notifications:${parsedInput.data.eventId}`,
          getFinalApprovalNotifications({
            eventId: parsedInput.data.eventId,
            eventName: event.name,
            submitterId: event.submitterId,
          }).map((notification) =>
            createNotification(
              notification.userId,
              notification.eventId,
              notification.message,
            ),
          ),
        );

        const submitter = await getUserContact(supabase, event.submitterId);

        await settleNonCriticalEffects(
          `final approval email notifications:${parsedInput.data.eventId}`,
          submitter?.email
            ? [sendEventApprovedEmail(submitter.email, event.name)]
            : [],
        );
      },
    );

    await runNonCriticalEffect(
      `final approval microsoft calendar sync:${parsedInput.data.eventId}`,
      async () => {
        await syncApprovedEventToMicrosoftCalendar(parsedInput.data.eventId);
      },
    );

    revalidateWorkflowPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Final approval recorded and the submitter has been notified.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to approve this event right now.",
    };
  }
}

export async function rejectStep(input: {
  eventId: string;
  reason: string;
}): Promise<ApprovalActionResult> {
  const parsedInput = rejectionSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.error.issues[0]?.message ?? "Invalid rejection action.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveActor(supabase);
    const event = await getWorkflowEvent(supabase, parsedInput.data.eventId);
    const currentStep = await getCurrentPendingStep(
      supabase,
      parsedInput.data.eventId,
      event.currentStep,
    );

    if (currentStep.approverId !== actor.id) {
      throw new Error("This approval step is not assigned to you.");
    }

    const actionedAt = new Date().toISOString();
    const { error: stepError } = await supabase
      .from("approval_steps")
      .update({
        status: "rejected",
        reason: parsedInput.data.reason,
        suggested_date: null,
        suggested_start_time: null,
        actioned_at: actionedAt,
      })
      .eq("id", currentStep.id);

    if (stepError) {
      throw new Error(stepError.message);
    }

    const { error: eventError } = await supabase
      .from("events")
      .update({
        status: "needs_revision",
      })
      .eq("id", parsedInput.data.eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await runNonCriticalEffect(
      `reject step notifications:${parsedInput.data.eventId}`,
      async () => {
        await settleNonCriticalEffects(
          `reject step in-app notifications:${parsedInput.data.eventId}`,
          getRejectionNotifications({
            eventId: parsedInput.data.eventId,
            eventName: event.name,
            submitterId: event.submitterId,
            reason: parsedInput.data.reason,
          }).map((notification) =>
            createNotification(
              notification.userId,
              notification.eventId,
              notification.message,
            ),
          ),
        );

        const submitter = await getUserContact(supabase, event.submitterId);

        await settleNonCriticalEffects(
          `reject step email notifications:${parsedInput.data.eventId}`,
          submitter?.email
            ? [
                sendEventRejectedEmail(
                  submitter.email,
                  event.name,
                  parsedInput.data.reason,
                ),
              ]
            : [],
        );
      },
    );

    revalidateWorkflowPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Rejection recorded and the submitter has been notified.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reject this event right now.",
    };
  }
}

export async function suggestAlternative(input: {
  eventId: string;
  suggestedDate: string;
  suggestedTime: string;
}): Promise<ApprovalActionResult> {
  const parsedInput = alternativeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error:
        parsedInput.error.issues[0]?.message ?? "Invalid alternative suggestion.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveActor(supabase);
    const event = await getWorkflowEvent(supabase, parsedInput.data.eventId);
    const currentStep = await getCurrentPendingStep(
      supabase,
      parsedInput.data.eventId,
      event.currentStep,
    );

    if (currentStep.approverId !== actor.id) {
      throw new Error("This approval step is not assigned to you.");
    }

    const { error: stepError } = await supabase
      .from("approval_steps")
      .update({
        status: "rejected",
        reason: "Alternative schedule suggested.",
        suggested_date: parsedInput.data.suggestedDate,
        suggested_start_time: parsedInput.data.suggestedTime,
        actioned_at: new Date().toISOString(),
      })
      .eq("id", currentStep.id);

    if (stepError) {
      throw new Error(stepError.message);
    }

    const { error: eventError } = await supabase
      .from("events")
      .update({
        status: "needs_revision",
      })
      .eq("id", parsedInput.data.eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await runNonCriticalEffect(
      `suggest alternative notifications:${parsedInput.data.eventId}`,
      async () => {
        await settleNonCriticalEffects(
          `suggest alternative in-app notifications:${parsedInput.data.eventId}`,
          getAlternativeNotifications({
            eventId: parsedInput.data.eventId,
            eventName: event.name,
            submitterId: event.submitterId,
            suggestedDate: parsedInput.data.suggestedDate,
            suggestedTime: parsedInput.data.suggestedTime,
          }).map((notification) =>
            createNotification(
              notification.userId,
              notification.eventId,
              notification.message,
            ),
          ),
        );

        const submitter = await getUserContact(supabase, event.submitterId);

        await settleNonCriticalEffects(
          `suggest alternative email notifications:${parsedInput.data.eventId}`,
          submitter?.email
            ? [
                sendAlternativeSuggestedEmail(
                  submitter.email,
                  event.name,
                  parsedInput.data.suggestedDate,
                  parsedInput.data.suggestedTime,
                ),
              ]
            : [],
        );
      },
    );

    revalidateWorkflowPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Alternative suggestion recorded and the submitter has been notified.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to suggest an alternative right now.",
    };
  }
}

export async function resubmitEvent(input: {
  eventId: string;
}): Promise<ApprovalActionResult> {
  const parsedInput = eventActionSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error:
        parsedInput.error.issues[0]?.message ?? "Invalid resubmission request.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveActor(supabase);
    const event = await getWorkflowEvent(supabase, parsedInput.data.eventId);

    if (event.submitterId !== actor.id) {
      throw new Error("Only the original submitter can resubmit this event.");
    }

    if (event.status !== "needs_revision") {
      throw new Error("Only events awaiting revision can be resubmitted.");
    }

    const { error: stepsError } = await supabase
      .from("approval_steps")
      .update({
        status: "pending",
        reason: null,
        suggested_date: null,
        suggested_start_time: null,
        actioned_at: null,
      })
      .eq("event_id", parsedInput.data.eventId);

    if (stepsError) {
      throw new Error(stepsError.message);
    }

    const firstStep = await getStepByNumber(supabase, parsedInput.data.eventId, 1);

    if (!firstStep) {
      throw new Error("The approval chain could not be restarted.");
    }

    const { error: eventError } = await supabase
      .from("events")
      .update({
        status: "pending",
        current_step: 1,
      })
      .eq("id", parsedInput.data.eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await runNonCriticalEffect(
      `resubmit event notifications:${parsedInput.data.eventId}`,
      async () => {
        const facilitiesRecipient = await getFacilitiesRecipient(supabase);

        await settleNonCriticalEffects(
          `resubmit event in-app notifications:${parsedInput.data.eventId}`,
          getResubmissionNotifications({
            eventId: parsedInput.data.eventId,
            eventName: event.name,
            firstApproverId: firstStep.approverId,
            facilitiesDirectorId: facilitiesRecipient?.id,
          }).map((notification) =>
            createNotification(
              notification.userId,
              notification.eventId,
              notification.message,
            ),
          ),
        );

        const [firstApprover] = await Promise.all([
          getUserContact(supabase, firstStep.approverId),
        ]);

        await settleNonCriticalEffects(
          `resubmit event email notifications:${parsedInput.data.eventId}`,
          [
            ...(firstApprover?.email
              ? [
                  sendApprovalRequestEmail(
                    firstApprover.email,
                    event.name,
                    parsedInput.data.eventId,
                  ),
                ]
              : []),
            ...(facilitiesRecipient?.email
              ? [
                  sendFacilitiesNotificationEmail(
                    facilitiesRecipient.email,
                    event.name,
                    parsedInput.data.eventId,
                  ),
                ]
              : []),
          ],
        );
      },
    );

    revalidateWorkflowPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Event resubmitted and the approval chain has restarted.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to resubmit this event right now.",
    };
  }
}

export async function flagFacilityConflict(input: {
  eventId: string;
  notes: string;
}): Promise<ApprovalActionResult> {
  const parsedInput = facilityConflictSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error:
        parsedInput.error.issues[0]?.message ?? "Invalid facility conflict action.",
    };
  }

  const supabase = createClient();

  try {
    const actor = await getActiveActor(supabase);

    if (actor.role !== "admin" && actor.title !== "Facilities Director") {
      throw new Error("Only Facilities can flag facility conflicts.");
    }

    const event = await getWorkflowEvent(supabase, parsedInput.data.eventId);

    if (event.status !== "pending") {
      throw new Error("Facility conflicts can only be flagged while an event is pending.");
    }

    const currentStep = await getCurrentPendingStep(
      supabase,
      parsedInput.data.eventId,
      event.currentStep,
    );
    const existingConflict = await getFacilityConflict(
      supabase,
      parsedInput.data.eventId,
    );
    const timestamp = new Date().toISOString();

    if (existingConflict) {
      const { error: updateError } = await supabase
        .from("facility_conflicts")
        .update({
          notes: parsedInput.data.notes,
          flagged_by: actor.id,
          updated_at: timestamp,
        })
        .eq("event_id", parsedInput.data.eventId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from("facility_conflicts")
        .insert({
          event_id: parsedInput.data.eventId,
          notes: parsedInput.data.notes,
          flagged_by: actor.id,
          updated_at: timestamp,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const recipientIds = [event.submitterId, currentStep.approverId].filter(
      (userId, index, recipients) => recipients.indexOf(userId) === index,
    );

    await runNonCriticalEffect(
      `facility conflict notifications:${parsedInput.data.eventId}`,
      async () => {
        await settleNonCriticalEffects(
          `facility conflict in-app notifications:${parsedInput.data.eventId}`,
          recipientIds.map((userId) =>
            createNotification(
              userId,
              parsedInput.data.eventId,
              `Facilities flagged a conflict on "${event.name}": ${parsedInput.data.notes}`,
            ),
          ),
        );

        const recipients = await Promise.all(
          recipientIds.map((userId) => getUserContact(supabase, userId)),
        );

        await settleNonCriticalEffects(
          `facility conflict email notifications:${parsedInput.data.eventId}`,
          recipients.flatMap((recipient) =>
            recipient?.email
              ? [
                  sendFacilityConflictFlaggedEmail(
                    recipient.email,
                    event.name,
                    parsedInput.data.notes,
                    parsedInput.data.eventId,
                  ),
                ]
              : [],
          ),
        );
      },
    );

    revalidateWorkflowPaths(parsedInput.data.eventId);

    return {
      success: true,
      message: "Facility conflict saved and the submitter plus current approver were notified.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to flag this facility conflict right now.",
    };
  }
}

async function getActiveActor(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, active, role, title")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.active) {
    throw new Error("Your Maydan account is inactive.");
  }

  return {
    id: profile.id,
    role: profile.role,
    title: profile.title,
  };
}

async function getWorkflowEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
) {
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, status, current_step, submitter_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!event) {
    throw new Error("Event not found.");
  }

  if (!event.submitter_id) {
    throw new Error("Event submitter could not be resolved.");
  }

  return {
    id: event.id,
    name: event.name,
    status: event.status ?? "draft",
    currentStep: event.current_step ?? 1,
    submitterId: event.submitter_id,
  };
}

async function getCurrentPendingStep(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  currentStep: number,
) {
  const { data: step, error } = await supabase
    .from("approval_steps")
    .select("id, approver_id, step_number, status")
    .eq("event_id", eventId)
    .eq("step_number", currentStep)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!step || step.status !== "pending" || !step.approver_id) {
    throw new Error("This event is not awaiting an approval action.");
  }

  return {
    id: step.id,
    approverId: step.approver_id,
    stepNumber: step.step_number,
  };
}

async function getStepByNumber(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  stepNumber: number,
) {
  const { data: step, error } = await supabase
    .from("approval_steps")
    .select("id, approver_id, step_number, status")
    .eq("event_id", eventId)
    .eq("step_number", stepNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!step || !step.approver_id) {
    return null;
  }

  return {
    id: step.id,
    approverId: step.approver_id,
    stepNumber: step.step_number,
    status: step.status ?? "pending",
  };
}

async function getUserContact(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}

async function getFacilitiesRecipient(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("title", "Facilities Director")
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
  };
}

async function getFacilityConflict(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
) {
  const { data, error } = await supabase
    .from("facility_conflicts")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function revalidateWorkflowPaths(eventId: string) {
  revalidatePath("/approvals");
  revalidatePath(`/approvals/${eventId}`);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}
