import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  buildApprovalChain,
  createApprovalRoutingDependencies,
  createSupabaseApprovalRoutingRepository,
} from "../lib/routing/approval-router";
import {
  getEventSubmittedNotifications,
  getFinalApprovalNotifications,
  getIntermediateApprovalNotifications,
  getMarketingRequestNotifications,
  getRejectionNotifications,
  getResubmissionNotifications,
} from "../lib/notification-payloads";
import {
  buildLiveFixtures,
  cleanupEvents,
  getAdminClient,
  hasLiveSupabaseEnv,
} from "./live-supabase-helpers";
import { getRouteRedirect } from "../lib/supabase/route-access";
import type { EntityType, GradeLevel } from "../types";

const hasEnv = hasLiveSupabaseEnv();

test("live workflow verification: approval chains resolve correctly for all five entity paths", { skip: !hasEnv }, async () => {
  const admin = getAdminClient();
  const repository = createSupabaseApprovalRoutingRepository(admin as any);
  const dependencies = createApprovalRoutingDependencies(repository);

  const [hosa, house, athletics, hsDepartment, mathDepartment] = await Promise.all([
    getEntity(admin, "HOSA"),
    getEntity(admin, "House of Abu Bakr"),
    getEntity(admin, "Athletics"),
    getEntity(admin, "Science Department"),
    getEntity(admin, "Math Department"),
  ]);

  const [hsPrincipal, msPrincipal, tarbiyahDirector, athleticDirector, facilitiesDirector] =
    await Promise.all([
      getUserByTitles(admin, ["HS Principal", "Head of School"]),
      getUserByTitle(admin, "MS Principal"),
      getUserByTitle(admin, "Tarbiyah Director"),
      getUserByTitle(admin, "Athletic Director"),
      getUserByTitle(admin, "Facilities Director"),
    ]);

  const [clubChain, houseChain, athleticsChain, hsDepartmentChain, msDepartmentChain] =
    await Promise.all([
      buildApprovalChain("club", hosa.id, "HS", dependencies),
      buildApprovalChain("house", house.id, "Both", dependencies),
      buildApprovalChain("athletics", athletics.id, "HS", dependencies),
      buildApprovalChain("department", hsDepartment.id, "HS", dependencies),
      buildApprovalChain("department", mathDepartment.id, "MS", dependencies),
    ]);

  assert.deepEqual(clubChain.approverIds, [hosa.head_user_id, hsPrincipal.id]);
  assert.deepEqual(houseChain.approverIds, [
    house.head_user_id,
    tarbiyahDirector.id,
    hsPrincipal.id,
  ]);
  assert.deepEqual(athleticsChain.approverIds, [
    athletics.head_user_id,
    athleticDirector.id,
    hsPrincipal.id,
  ]);
  assert.deepEqual(hsDepartmentChain.approverIds, [
    hsDepartment.head_user_id,
    hsPrincipal.id,
  ]);
  assert.deepEqual(msDepartmentChain.approverIds, [
    mathDepartment.head_user_id,
    msPrincipal.id,
  ]);

  assert.equal(clubChain.ccUserId, facilitiesDirector.id);
  assert.equal(houseChain.ccUserId, facilitiesDirector.id);
  assert.equal(athleticsChain.ccUserId, facilitiesDirector.id);
  assert.equal(hsDepartmentChain.ccUserId, facilitiesDirector.id);
  assert.equal(msDepartmentChain.ccUserId, facilitiesDirector.id);
});

test("live workflow verification: calendar query only returns approved events", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const createdEventIds: string[] = [];

  try {
    const [approvedEvent, pendingEvent, draftEvent] = await Promise.all([
      createEventWithStatus(fixtures.admin, fixtures.submitter.user.id, {
        entityName: "HOSA",
        namePrefix: "Calendar Approved",
        status: "approved",
      }),
      createEventWithStatus(fixtures.admin, fixtures.submitter.user.id, {
        entityName: "HOSA",
        namePrefix: "Calendar Pending",
        status: "pending",
      }),
      createEventWithStatus(fixtures.admin, fixtures.submitter.user.id, {
        entityName: "HOSA",
        namePrefix: "Calendar Draft",
        status: "draft",
      }),
    ]);

    createdEventIds.push(approvedEvent.id, pendingEvent.id, draftEvent.id);

    const { data: calendarEvents, error } = await fixtures.submitter.client
      .from("events")
      .select("id, status")
      .eq("status", "approved")
      .in("id", createdEventIds);

    assert.equal(error, null);
    assert.deepEqual(calendarEvents?.map((event) => event.id), [approvedEvent.id]);
  } finally {
    await cleanupEvents(fixtures.admin, createdEventIds);
  }
});

test("live workflow verification: deactivated facilities are excluded from submission-form options", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const facilityName = `Maydan Test Facility ${randomUUID()}`;

  const { data: facility, error: insertError } = await fixtures.admin
    .from("facilities")
    .insert({
      name: facilityName,
      capacity: 40,
      notes: "Temporary test facility",
      active: false,
    })
    .select("id")
    .single();

  assert.equal(insertError, null);

  try {
    const { data: visibleFacilities, error } = await fixtures.submitter.client
      .from("facilities")
      .select("id, name")
      .eq("active", true)
      .eq("name", facilityName);

    assert.equal(error, null);
    assert.equal(visibleFacilities?.length, 0);
  } finally {
    await fixtures.admin.from("facilities").delete().eq("id", facility?.id ?? "");
  }
});

test("live workflow verification: inactive Maydan users are blocked from protected routes", () => {
  const redirect = getRouteRedirect({
    pathname: "/dashboard",
    isAuthenticated: true,
    userRole: "staff",
    userActive: false,
  });

  assert.deepEqual(redirect, {
    pathname: "/login",
  });
});

const approvalChainScenarios: Array<{
  label: string;
  entityName: string;
  entityType: EntityType;
  gradeLevel: GradeLevel;
  expectedSteps: number;
}> = [
  {
    label: "Club event full chain",
    entityName: "HOSA",
    entityType: "club",
    gradeLevel: "HS",
    expectedSteps: 2,
  },
  {
    label: "House event full chain",
    entityName: "House of Abu Bakr",
    entityType: "house",
    gradeLevel: "HS",
    expectedSteps: 3,
  },
  {
    label: "Athletics event full chain",
    entityName: "Athletics",
    entityType: "athletics",
    gradeLevel: "HS",
    expectedSteps: 3,
  },
  {
    label: "HS Department event full chain",
    entityName: "Science Department",
    entityType: "department",
    gradeLevel: "HS",
    expectedSteps: 2,
  },
  {
    label: "MS Department event full chain",
    entityName: "Math Department",
    entityType: "department",
    gradeLevel: "MS",
    expectedSteps: 2,
  },
];

for (const scenario of approvalChainScenarios) {
  test(`live workflow verification: ${scenario.label}`, { skip: !hasEnv }, async () => {
    const fixtures = await buildLiveFixtures();
    const admin = fixtures.admin;
    const eventIds: string[] = [];

    try {
      const workflow = await createWorkflowScenario(admin, fixtures.submitter.user.id, {
        entityName: scenario.entityName,
        entityType: scenario.entityType,
        gradeLevel: scenario.gradeLevel,
        namePrefix: scenario.label,
      });

      eventIds.push(workflow.eventId);

      const notificationsAfterSubmit = await getNotificationsForEvent(admin, workflow.eventId);
      assert.equal(workflow.stepIds.length, scenario.expectedSteps);
      assert.ok(
        notificationsAfterSubmit.some(
          (notification) => notification.user_id === workflow.chain.approverIds[0],
        ),
        `${scenario.label} should notify the first approver on submission.`,
      );
      assert.ok(
        notificationsAfterSubmit.some(
          (notification) => notification.user_id === workflow.chain.ccUserId,
        ),
        `${scenario.label} should notify Facilities on submission.`,
      );

      for (let stepNumber = 1; stepNumber <= workflow.stepIds.length; stepNumber += 1) {
        await approveWorkflowStep(admin, workflow.eventId, stepNumber);
      }

      const finalEvent = await getEventState(admin, workflow.eventId);
      const finalNotifications = await getNotificationsForEvent(admin, workflow.eventId);

      assert.equal(finalEvent.status, "approved");
      assert.equal(finalEvent.current_step, workflow.stepIds.length + 1);
      assert.ok(
        finalNotifications.some(
          (notification) =>
            notification.user_id === fixtures.submitter.user.id &&
            notification.message.includes("fully approved"),
        ),
        `${scenario.label} should notify the submitter on final approval.`,
      );
    } finally {
      await cleanupEvents(admin, eventIds);
    }
  });
}

test("live workflow verification: rejection and resubmission reset the full chain", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const admin = fixtures.admin;
  const eventIds: string[] = [];

  try {
    const workflow = await createWorkflowScenario(admin, fixtures.submitter.user.id, {
      entityName: "HOSA",
      entityType: "club",
      gradeLevel: "HS",
      namePrefix: "Rejection Resubmission",
    });

    eventIds.push(workflow.eventId);

    await rejectWorkflowStep(admin, workflow.eventId, 1, "Need a clearer logistics plan.");

    let event = await getEventState(admin, workflow.eventId);
    let notifications = await getNotificationsForEvent(admin, workflow.eventId);

    assert.equal(event.status, "needs_revision");
    assert.ok(
      notifications.some(
        (notification) =>
          notification.user_id === fixtures.submitter.user.id &&
          notification.message.includes("Need a clearer logistics plan."),
      ),
      "Rejecting an event should notify the submitter with the revision reason.",
    );

    await resubmitWorkflow(admin, workflow.eventId);

    event = await getEventState(admin, workflow.eventId);
    notifications = await getNotificationsForEvent(admin, workflow.eventId);
    const steps = await getApprovalSteps(admin, workflow.eventId);

    assert.equal(event.status, "pending");
    assert.equal(event.current_step, 1);
    assert.ok(
      steps.every((step) => step.status === "pending"),
      "Resubmission should reset all approval steps back to pending.",
    );
    assert.ok(
      notifications.some(
        (notification) =>
          notification.user_id === workflow.chain.approverIds[0] &&
          notification.message.includes("Action required: review"),
      ),
      "Resubmission should notify the first approver again.",
    );
  } finally {
    await cleanupEvents(admin, eventIds);
  }
});

test("live workflow verification: marketing submissions notify PR staff", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const admin = fixtures.admin;
  const eventIds: string[] = [];

  try {
    const workflow = await createWorkflowScenario(admin, fixtures.submitter.user.id, {
      entityName: "HOSA",
      entityType: "club",
      gradeLevel: "HS",
      marketingNeeded: true,
      namePrefix: "Marketing Notification",
    });

    eventIds.push(workflow.eventId);

    const notifications = await getNotificationsForEvent(admin, workflow.eventId);
    const prStaff = await getUserByTitle(admin, "PR Staff");

    assert.ok(
      notifications.some(
        (notification) =>
          notification.user_id === prStaff.id &&
          notification.message.includes("Marketing requested"),
      ),
      "Marketing submissions should notify PR staff.",
    );
  } finally {
    await cleanupEvents(admin, eventIds);
  }
});

async function getEntity(admin: ReturnType<typeof getAdminClient>, name: string) {
  const { data, error } = await admin
    .from("entities")
    .select("id, head_user_id")
    .eq("name", name)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing entity: ${name}`);
  }

  return data;
}

async function getEntityDetails(
  admin: ReturnType<typeof getAdminClient>,
  name: string,
) {
  const { data, error } = await admin
    .from("entities")
    .select("id, name, type, grade_level, head_user_id")
    .eq("name", name)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing entity details: ${name}`);
  }

  return data as {
    id: string;
    name: string;
    type: EntityType;
    grade_level: GradeLevel | null;
    head_user_id: string | null;
  };
}

async function getUserByTitle(
  admin: ReturnType<typeof getAdminClient>,
  title: string,
) {
  return getUserByTitles(admin, [title]);
}

async function getUserByTitles(
  admin: ReturnType<typeof getAdminClient>,
  titles: string[],
) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .in("title", titles)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing user with title: ${titles.join(", ")}`);
  }

  return data;
}

async function createEventWithStatus(
  admin: ReturnType<typeof getAdminClient>,
  submitterId: string,
  input: {
    entityName: string;
    namePrefix: string;
    status: "draft" | "pending" | "needs_revision" | "approved" | "cancelled";
  },
) {
  const { data: facility } = await admin
    .from("facilities")
    .select("id")
    .eq("name", "Auditorium")
    .maybeSingle();
  const { data: entity } = await admin
    .from("entities")
    .select("id")
    .eq("name", input.entityName)
    .maybeSingle();

  const { data, error } = await admin
    .from("events")
    .insert({
      name: `${input.namePrefix} ${randomUUID()}`,
      date: "2026-04-02",
      start_time: "09:00",
      end_time: "10:00",
      facility_id: facility?.id ?? null,
      description: "Workflow verification event",
      audience: ["Students"],
      grade_level: "HS",
      expected_attendance: 25,
      staffing_needs: null,
      marketing_needed: false,
      status: input.status,
      submitter_id: submitterId,
      entity_id: entity?.id ?? null,
      current_step: 1,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create workflow verification event.");
  }

  return data;
}

async function createWorkflowScenario(
  admin: ReturnType<typeof getAdminClient>,
  submitterId: string,
  input: {
    entityName: string;
    entityType: EntityType;
    gradeLevel: GradeLevel;
    marketingNeeded?: boolean;
    namePrefix: string;
  },
) {
  const repository = createSupabaseApprovalRoutingRepository(admin as any);
  const dependencies = createApprovalRoutingDependencies(repository);
  const [entity, facility, prStaffIds] = await Promise.all([
    getEntityDetails(admin, input.entityName),
    getFacilityByName(admin, "Auditorium"),
    input.marketingNeeded ? getUserIdsByTitle(admin, "PR Staff") : Promise.resolve([]),
  ]);
  const chain = await buildApprovalChain(
    input.entityType,
    entity.id,
    input.gradeLevel,
    dependencies,
  );
  const eventName = `${input.namePrefix} ${randomUUID()}`;

  const { data: event, error: eventError } = await admin
    .from("events")
    .insert({
      name: eventName,
      date: "2026-04-14",
      start_time: "10:00",
      end_time: "11:00",
      facility_id: facility.id,
      description: "Live workflow verification event",
      audience: ["Students"],
      grade_level: input.gradeLevel,
      expected_attendance: 40,
      staffing_needs: null,
      marketing_needed: input.marketingNeeded ?? false,
      status: "pending",
      submitter_id: submitterId,
      entity_id: entity.id,
      current_step: 1,
    })
    .select("id, name")
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message ?? "Unable to create workflow verification event.");
  }

  const { data: stepRows, error: stepError } = await admin
    .from("approval_steps")
    .insert(
      chain.approverIds.map((approverId, index) => ({
        event_id: event.id,
        approver_id: approverId,
        step_number: index + 1,
        status: "pending",
      })),
    )
    .select("id, approver_id, step_number");

  if (stepError || !stepRows) {
    throw new Error(stepError?.message ?? "Unable to create approval steps.");
  }

  await insertNotifications(
    admin,
    getEventSubmittedNotifications({
      eventId: event.id,
      eventName: event.name,
      firstApproverId: chain.approverIds[0],
      facilitiesDirectorId: chain.ccUserId,
    }),
  );

  if (input.marketingNeeded) {
    const { error: marketingError } = await admin.from("marketing_requests").insert({
      event_id: event.id,
      type: "announcement",
      details: "Marketing workflow verification request",
      target_audience: "School community",
      priority: "standard",
      file_url: null,
    });

    if (marketingError) {
      throw new Error(marketingError.message);
    }

    await insertNotifications(
      admin,
      getMarketingRequestNotifications({
        eventId: event.id,
        eventName: event.name,
        prStaffIds,
      }),
    );
  }

  return {
    eventId: event.id,
    eventName: event.name,
    stepIds: stepRows.map((step) => step.id),
    chain,
  };
}

async function approveWorkflowStep(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
  stepNumber: number,
) {
  const event = await getEventState(admin, eventId);
  const step = await getStepByNumber(admin, eventId, stepNumber);
  const actionedAt = new Date().toISOString();

  const { error: stepError } = await admin
    .from("approval_steps")
    .update({
      status: "approved",
      actioned_at: actionedAt,
      reason: null,
      suggested_date: null,
      suggested_start_time: null,
    })
    .eq("id", step.id);

  if (stepError) {
    throw new Error(stepError.message);
  }

  const nextStep = await getOptionalStepByNumber(admin, eventId, stepNumber + 1);

  if (nextStep) {
    const { error: eventError } = await admin
      .from("events")
      .update({
        current_step: nextStep.step_number,
        status: "pending",
      })
      .eq("id", eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await insertNotifications(
      admin,
      getIntermediateApprovalNotifications({
        eventId,
        eventName: event.name,
        nextApproverId: nextStep.approver_id,
      }),
    );

    return;
  }

  const { error: eventError } = await admin
    .from("events")
    .update({
      current_step: stepNumber + 1,
      status: "approved",
    })
    .eq("id", eventId);

  if (eventError) {
    throw new Error(eventError.message);
  }

  await insertNotifications(
    admin,
    getFinalApprovalNotifications({
      eventId,
      eventName: event.name,
      submitterId: event.submitter_id,
    }),
  );
}

async function rejectWorkflowStep(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
  stepNumber: number,
  reason: string,
) {
  const event = await getEventState(admin, eventId);
  const step = await getStepByNumber(admin, eventId, stepNumber);

  const { error: stepError } = await admin
    .from("approval_steps")
    .update({
      status: "rejected",
      reason,
      actioned_at: new Date().toISOString(),
      suggested_date: null,
      suggested_start_time: null,
    })
    .eq("id", step.id);

  if (stepError) {
    throw new Error(stepError.message);
  }

  const { error: eventError } = await admin
    .from("events")
    .update({ status: "needs_revision" })
    .eq("id", eventId);

  if (eventError) {
    throw new Error(eventError.message);
  }

  await insertNotifications(
    admin,
    getRejectionNotifications({
      eventId,
      eventName: event.name,
      submitterId: event.submitter_id,
      reason,
    }),
  );
}

async function resubmitWorkflow(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
) {
  const event = await getEventState(admin, eventId);
  const steps = await getApprovalSteps(admin, eventId);
  const facilitiesDirector = await getUserByTitle(admin, "Facilities Director");

  const { error: eventError } = await admin
    .from("events")
    .update({
      status: "pending",
      current_step: 1,
    })
    .eq("id", eventId);

  if (eventError) {
    throw new Error(eventError.message);
  }

  const { error: stepsError } = await admin
    .from("approval_steps")
    .update({
      status: "pending",
      reason: null,
      suggested_date: null,
      suggested_start_time: null,
      actioned_at: null,
    })
    .eq("event_id", eventId);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  await insertNotifications(
    admin,
    getResubmissionNotifications({
      eventId,
      eventName: event.name,
      firstApproverId: steps[0].approver_id,
      facilitiesDirectorId: facilitiesDirector.id,
    }),
  );
}

async function insertNotifications(
  admin: ReturnType<typeof getAdminClient>,
  notifications: Array<{ userId: string; eventId: string; message: string }>,
) {
  if (notifications.length === 0) {
    return;
  }

  const { error } = await admin.from("notifications").insert(
    notifications.map((notification) => ({
      user_id: notification.userId,
      event_id: notification.eventId,
      message: notification.message,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getEventState(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
) {
  const { data, error } = await admin
    .from("events")
    .select("id, name, status, current_step, submitter_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing event ${eventId}`);
  }

  return data;
}

async function getApprovalSteps(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
) {
  const { data, error } = await admin
    .from("approval_steps")
    .select("id, approver_id, step_number, status")
    .eq("event_id", eventId)
    .order("step_number");

  if (error || !data) {
    throw new Error(error?.message ?? `Missing approval steps for event ${eventId}`);
  }

  return data;
}

async function getStepByNumber(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
  stepNumber: number,
) {
  const { data, error } = await admin
    .from("approval_steps")
    .select("id, approver_id, step_number")
    .eq("event_id", eventId)
    .eq("step_number", stepNumber)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing step ${stepNumber} for event ${eventId}`);
  }

  return data;
}

async function getOptionalStepByNumber(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
  stepNumber: number,
) {
  const { data, error } = await admin
    .from("approval_steps")
    .select("id, approver_id, step_number")
    .eq("event_id", eventId)
    .eq("step_number", stepNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getFacilityByName(
  admin: ReturnType<typeof getAdminClient>,
  name: string,
) {
  const { data, error } = await admin
    .from("facilities")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Missing facility: ${name}`);
  }

  return data;
}

async function getNotificationsForEvent(
  admin: ReturnType<typeof getAdminClient>,
  eventId: string,
) {
  const { data, error } = await admin
    .from("notifications")
    .select("user_id, message")
    .eq("event_id", eventId);

  if (error || !data) {
    throw new Error(error?.message ?? `Missing notifications for event ${eventId}`);
  }

  return data;
}

async function getUserIdsByTitle(
  admin: ReturnType<typeof getAdminClient>,
  title: string,
) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("title", title);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((user) => user.id);
}
