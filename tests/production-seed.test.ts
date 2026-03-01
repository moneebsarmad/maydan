import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApprovalChain,
  createApprovalRoutingDependencies,
  createSupabaseApprovalRoutingRepository,
} from "../lib/routing/approval-router";
import { getAdminClient, hasLiveSupabaseEnv } from "./live-supabase-helpers";
import type { GradeLevel } from "../types";

const hasEnv = hasLiveSupabaseEnv();

const expectedFacilities = [
  "Auditorium",
  "Gym",
  "Main Field",
  "Classroom",
  "MPH",
  "Library",
  "Conference Room",
];

const expectedEntities = [
  "HOSA",
  "TED Talk Club",
  "Chess Club",
  "House of Abu Bakr",
  "House of Khadijah",
  "House of Umar",
  "House of Aishah",
  "Science Department",
  "Math Department",
  "HS Quran Department",
  "MS Quran Department",
  "HS Islamic Studies Department",
  "MS Islamic Studies Department",
  "Arabic Department",
  "English Department",
  "Social Studies Department",
  "PE Department",
  "Athletics",
];

test("production seed contains the required facilities and entities", { skip: !hasEnv }, async () => {
  const admin = getAdminClient();
  const [{ data: facilities, error: facilitiesError }, { data: entities, error: entitiesError }] =
    await Promise.all([
      admin.from("facilities").select("name").in("name", expectedFacilities),
      admin.from("entities").select("name").in("name", expectedEntities),
    ]);

  assert.equal(facilitiesError, null);
  assert.equal(entitiesError, null);
  assert.deepEqual(
    new Set((facilities ?? []).map((facility) => facility.name)),
    new Set(expectedFacilities),
  );
  assert.deepEqual(
    new Set((entities ?? []).map((entity) => entity.name)),
    new Set(expectedEntities),
  );
});

test("all seeded entities resolve to real approval chains in live Supabase", { skip: !hasEnv }, async () => {
  const admin = getAdminClient();
  const repository = createSupabaseApprovalRoutingRepository(admin as any);
  const dependencies = createApprovalRoutingDependencies(repository);
  const { data: entities, error } = await admin
    .from("entities")
    .select("id, name, type, grade_level")
    .in("name", expectedEntities)
    .order("name");

  assert.equal(error, null);
  assert.equal(entities?.length, expectedEntities.length);

  for (const entity of entities ?? []) {
    for (const gradeLevel of getGradeLevelsToVerify(entity.type, entity.grade_level)) {
      const chain = await buildApprovalChain(
        entity.type,
        entity.id,
        gradeLevel,
        dependencies,
      );

      assert.ok(
        chain.approverIds.length >= 2,
        `Expected at least 2 approvers for ${entity.name} (${gradeLevel})`,
      );
      for (const approverId of chain.approverIds) {
        assert.ok(
          approverId,
          `Expected a real approver id for ${entity.name} (${gradeLevel})`,
        );
      }
      assert.ok(
        chain.ccUserId,
        `Expected a Facilities Director cc id for ${entity.name} (${gradeLevel})`,
      );
    }
  }
});

function getGradeLevelsToVerify(
  entityType: string,
  gradeLevel: string | null,
): GradeLevel[] {
  if (entityType !== "department") {
    return [gradeLevel === "MS" ? "MS" : "HS"];
  }

  if (gradeLevel === "Both") {
    return ["HS", "MS"];
  }

  return [gradeLevel === "MS" ? "MS" : "HS"];
}
