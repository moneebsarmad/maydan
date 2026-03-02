import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApprovalChain,
  createApprovalRoutingDependencies,
  type DepartmentApprovalChainStepRecord,
} from "../lib/routing/approval-router";

function createDependencies(options?: {
  departmentChainSteps?: Record<string, DepartmentApprovalChainStepRecord[]>;
  activeUserIds?: string[];
}) {
  return createApprovalRoutingDependencies({
    async getEntityHeadUserId(entityId) {
      const entityHeads: Record<string, string> = {
        clubEntity: "club-adviser-id",
        houseEntity: "house-mentor-id",
        athleticsEntity: "coach-id",
        hsDepartmentEntity: "hs-department-head-id",
        msDepartmentEntity: "ms-department-head-id",
        configuredDepartmentEntity: "configured-department-head-id",
      };

      return entityHeads[entityId] ?? null;
    },
    async getUserIdByTitle(titles) {
      const usersByTitle: Record<string, string> = {
        "HS Principal": "hs-principal-id",
        "Head of School": "head-of-school-id",
        "MS Principal": "ms-principal-id",
        "Tarbiyah Director": "tarbiyah-director-id",
        "Athletic Director": "athletic-director-id",
        "Facilities Director": "facilities-director-id",
      };

      for (const title of titles) {
        const userId = usersByTitle[title];
        if (userId) {
          return userId;
        }
      }

      return null;
    },
    async getActiveDepartmentChainSteps(entityId, gradeLevel) {
      return options?.departmentChainSteps?.[`${entityId}:${gradeLevel}`] ?? null;
    },
    async getActiveUserId(userId) {
      return options?.activeUserIds?.includes(userId) ? userId : null;
    },
  });
}

test("Club returns Club Adviser then HS Principal and Facilities Director CC", async () => {
  const result = await buildApprovalChain(
    "club",
    "clubEntity",
    "HS",
    createDependencies(),
  );

  assert.deepEqual(result.approverIds, ["club-adviser-id", "hs-principal-id"]);
  assert.equal(result.ccUserId, "facilities-director-id");
});

test("House returns House Mentor then Tarbiyah Director then HS Principal", async () => {
  const result = await buildApprovalChain(
    "house",
    "houseEntity",
    "Both",
    createDependencies(),
  );

  assert.deepEqual(result.approverIds, [
    "house-mentor-id",
    "tarbiyah-director-id",
    "hs-principal-id",
  ]);
  assert.equal(result.ccUserId, "facilities-director-id");
});

test("Athletics returns coach then Athletic Director then HS Principal", async () => {
  const result = await buildApprovalChain(
    "athletics",
    "athleticsEntity",
    "HS",
    createDependencies(),
  );

  assert.deepEqual(result.approverIds, [
    "coach-id",
    "athletic-director-id",
    "hs-principal-id",
  ]);
  assert.equal(result.ccUserId, "facilities-director-id");
});

test("HS department returns Department Head then HS Principal", async () => {
  const result = await buildApprovalChain(
    "department",
    "hsDepartmentEntity",
    "HS",
    createDependencies(),
  );

  assert.deepEqual(result.approverIds, [
    "hs-department-head-id",
    "hs-principal-id",
  ]);
  assert.equal(result.ccUserId, "facilities-director-id");
});

test("MS department returns Department Head then MS Principal", async () => {
  const result = await buildApprovalChain(
    "department",
    "msDepartmentEntity",
    "MS",
    createDependencies(),
  );

  assert.deepEqual(result.approverIds, [
    "ms-department-head-id",
    "ms-principal-id",
  ]);
  assert.equal(result.ccUserId, "facilities-director-id");
});

test("Configured department chain overrides the default department fallback", async () => {
  const result = await buildApprovalChain(
    "department",
    "configuredDepartmentEntity",
    "HS",
    createDependencies({
      departmentChainSteps: {
        "configuredDepartmentEntity:HS": [
          {
            stepNumber: 1,
            sourceType: "specific_user",
            userId: "custom-reviewer-id",
            titleKey: null,
            isBlocking: true,
          },
          {
            stepNumber: 2,
            sourceType: "title_lookup",
            userId: null,
            titleKey: "HS Principal",
            isBlocking: true,
          },
          {
            stepNumber: 3,
            sourceType: "specific_user",
            userId: "final-signer-id",
            titleKey: null,
            isBlocking: true,
          },
        ],
      },
      activeUserIds: ["custom-reviewer-id", "final-signer-id"],
    }),
  );

  assert.deepEqual(result.approverIds, [
    "custom-reviewer-id",
    "hs-principal-id",
    "final-signer-id",
  ]);
  assert.equal(result.ccUserId, "facilities-director-id");
});
