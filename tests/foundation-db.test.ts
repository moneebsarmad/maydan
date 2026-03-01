import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLiveFixtures,
  cleanupEvents,
  createApprovalStep,
  createEventForUser,
  hasLiveSupabaseEnv,
} from "./live-supabase-helpers";

const hasEnv = hasLiveSupabaseEnv();

test("Supabase live connection supports auth and protected reads", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const createdEventIds: string[] = [];

  try {
    const pendingEvent = await createEventForUser({
      admin: fixtures.admin,
      submitterId: fixtures.submitter.user.id,
      entityName: "HOSA",
      namePrefix: "Connection Audit",
    });
    createdEventIds.push(pendingEvent.id);

    await createApprovalStep({
      admin: fixtures.admin,
      eventId: pendingEvent.id,
      approverId: fixtures.approver.user.id,
      stepNumber: 1,
    });

    const { data: ownEvents, error: ownEventsError } = await fixtures.submitter.client
      .from("events")
      .select("id, submitter_id, status")
      .eq("id", pendingEvent.id);

    assert.equal(ownEventsError, null);
    assert.equal(ownEvents?.length, 1);
    assert.equal(ownEvents?.[0]?.submitter_id, fixtures.submitter.user.id);

    const { data: ownNotifications, error: notificationsError } =
      await fixtures.submitter.client.from("notifications").select("id").limit(1);

    assert.equal(notificationsError, null);
    assert.ok(Array.isArray(ownNotifications));
  } finally {
    await cleanupEvents(fixtures.admin, createdEventIds);
  }
});

test("RLS prevents cross-submitter data leakage and blocks unauthorized approval actions", { skip: !hasEnv }, async () => {
  const fixtures = await buildLiveFixtures();
  const createdEventIds: string[] = [];

  try {
    const primaryEvent = await createEventForUser({
      admin: fixtures.admin,
      submitterId: fixtures.submitter.user.id,
      entityName: "HOSA",
      namePrefix: "Primary RLS Audit",
    });
    createdEventIds.push(primaryEvent.id);

    const secondaryEvent = await createEventForUser({
      admin: fixtures.admin,
      submitterId: fixtures.secondarySubmitter.user.id,
      entityName: "Math Department",
      namePrefix: "Secondary RLS Audit",
    });
    createdEventIds.push(secondaryEvent.id);

    const primaryStep = await createApprovalStep({
      admin: fixtures.admin,
      eventId: primaryEvent.id,
      approverId: fixtures.approver.user.id,
      stepNumber: 1,
    });

    await createApprovalStep({
      admin: fixtures.admin,
      eventId: secondaryEvent.id,
      approverId: fixtures.approver.user.id,
      stepNumber: 1,
    });

    const { data: leakedEvents, error: leakedEventsError } =
      await fixtures.submitter.client
        .from("events")
        .select("id")
        .eq("id", secondaryEvent.id);

    assert.equal(leakedEventsError, null);
    assert.equal(leakedEvents?.length, 0);

    const { data: ownVisibleEvents, error: ownVisibleEventsError } =
      await fixtures.secondarySubmitter.client
        .from("events")
        .select("id")
        .eq("id", primaryEvent.id);

    assert.equal(ownVisibleEventsError, null);
    assert.equal(ownVisibleEvents?.length, 0);

    const { data: unauthorizedApprovalResult, error: unauthorizedApprovalError } =
      await fixtures.secondarySubmitter.client
      .from("approval_steps")
      .update({
        status: "approved",
        actioned_at: new Date().toISOString(),
      })
      .eq("id", primaryStep.id)
      .select("id, status")
      .maybeSingle();

    assert.equal(unauthorizedApprovalError, null);
    assert.equal(unauthorizedApprovalResult, null);

    const { data: unchangedStepAfterSubmitterAttempt } = await fixtures.admin
      .from("approval_steps")
      .select("status")
      .eq("id", primaryStep.id)
      .maybeSingle();

    assert.equal(unchangedStepAfterSubmitterAttempt?.status, "pending");

    const { data: facilitiesEvents, error: facilitiesEventsError } =
      await fixtures.facilities.client
        .from("events")
        .select("id")
        .in("id", [primaryEvent.id, secondaryEvent.id]);

    assert.equal(facilitiesEventsError, null);
    assert.equal(facilitiesEvents?.length, 2);

    const { data: visibleSteps, error: visibleStepsError } =
      await fixtures.facilities.client
        .from("approval_steps")
        .select("id")
        .eq("id", primaryStep.id);

    assert.equal(visibleStepsError, null);
    assert.equal(visibleSteps?.length, 1);

    const { data: facilitiesApprovalResult, error: facilitiesApprovalError } =
      await fixtures.facilities.client
      .from("approval_steps")
      .update({
        status: "approved",
        actioned_at: new Date().toISOString(),
      })
      .eq("id", primaryStep.id)
      .select("id, status")
      .maybeSingle();

    assert.equal(facilitiesApprovalError, null);
    assert.equal(facilitiesApprovalResult, null);

    const { data: unchangedStepAfterFacilitiesAttempt } = await fixtures.admin
      .from("approval_steps")
      .select("status")
      .eq("id", primaryStep.id)
      .maybeSingle();

    assert.equal(unchangedStepAfterFacilitiesAttempt?.status, "pending");
  } finally {
    await cleanupEvents(fixtures.admin, createdEventIds);
  }
});
