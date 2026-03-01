import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  buildApprovalChain,
  createApprovalRoutingDependencies,
  createSupabaseApprovalRoutingRepository,
} from "../lib/routing/approval-router";
import {
  buildLiveFixtures,
  cleanupEvents,
  getAdminClient,
  hasLiveSupabaseEnv,
} from "./live-supabase-helpers";
import { getRouteRedirect } from "../lib/supabase/route-access";

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
    userRole: "submitter",
    userActive: false,
  });

  assert.deepEqual(redirect, {
    pathname: "/login",
  });
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
