import type {
  ApprovalChainStepSource,
  EntityType,
  GradeLevel,
} from "../../types";

type SupabaseSingleResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

export interface ApprovalRoutingRepository {
  getEntityHeadUserId(entityId: string): Promise<string | null>;
  getUserIdByTitle(titles: string[]): Promise<string | null>;
  getActiveDepartmentChainSteps?(
    entityId: string,
    gradeLevel: "MS" | "HS",
  ): Promise<DepartmentApprovalChainStepRecord[] | null>;
  getActiveUserId?(userId: string): Promise<string | null>;
}

export interface ApprovalRoutingDependencies {
  getClubAdviser(entityId: string): Promise<string>;
  getHouseMentor(entityId: string): Promise<string>;
  getSubmittingCoach(entityId: string): Promise<string>;
  getConfiguredDepartmentChain(
    entityId: string,
    gradeLevel: "MS" | "HS",
  ): Promise<string[] | null>;
  getTarbiyahDirector(): Promise<string>;
  getAthleticDirector(): Promise<string>;
  getDepartmentHead(entityId: string): Promise<string>;
  getHSPrincipal(): Promise<string>;
  getMSPrincipal(): Promise<string>;
  getFacilitiesDirector(): Promise<string>;
}

export interface ApprovalChainResult {
  approverIds: string[];
  ccUserId: string;
}

export interface DepartmentApprovalChainStepRecord {
  stepNumber: number;
  sourceType: ApprovalChainStepSource;
  userId: string | null;
  titleKey: string | null;
  isBlocking: boolean;
}

export interface SupabaseLike {
  from(table: "entities"): {
    select(columns: string): {
      eq(column: "id", value: string): {
        maybeSingle(): SupabaseSingleResult<{ head_user_id: string | null }>;
      };
    };
  };
  from(table: "users"): {
    select(columns: string): {
      in(column: "title", values: string[]): {
        maybeSingle(): SupabaseSingleResult<{ id: string }>;
      };
      eq(column: "id", value: string): {
        eq(column: "active", value: boolean): {
          maybeSingle(): SupabaseSingleResult<{ id: string }>;
        };
      };
    };
  };
  from(table: "approval_chain_templates"): {
    select(columns: string): {
      eq(column: "entity_id", value: string): {
        eq(column: "grade_level", value: "MS" | "HS"): {
          eq(column: "active", value: boolean): {
            maybeSingle(): SupabaseSingleResult<{ id: string }>;
          };
        };
      };
    };
  };
  from(table: "approval_chain_template_steps"): {
    select(columns: string): {
      eq(column: "template_id", value: string): {
        order(
          column: "step_number",
          options: { ascending: boolean },
        ): Promise<{
          data:
            | Array<{
                step_number: number;
                source_type: ApprovalChainStepSource;
                user_id: string | null;
                title_key: string | null;
                is_blocking: boolean;
              }>
            | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export function createSupabaseApprovalRoutingRepository(
  supabase: SupabaseLike,
): ApprovalRoutingRepository {
  return {
    async getEntityHeadUserId(entityId) {
      const { data, error } = await supabase
        .from("entities")
        .select("head_user_id")
        .eq("id", entityId)
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to read entity approver: ${error.message}`);
      }

      return data?.head_user_id ?? null;
    },
    async getUserIdByTitle(titles) {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .in("title", titles)
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to read user by title: ${error.message}`);
      }

      return data?.id ?? null;
    },
    async getActiveDepartmentChainSteps(entityId, gradeLevel) {
      const { data: template, error: templateError } = await supabase
        .from("approval_chain_templates")
        .select("id")
        .eq("entity_id", entityId)
        .eq("grade_level", gradeLevel)
        .eq("active", true)
        .maybeSingle();

      if (templateError) {
        throw new Error(
          `Unable to read department approval chain template: ${templateError.message}`,
        );
      }

      if (!template) {
        return null;
      }

      const { data: steps, error: stepsError } = await supabase
        .from("approval_chain_template_steps")
        .select("step_number, source_type, user_id, title_key, is_blocking")
        .eq("template_id", template.id)
        .order("step_number", { ascending: true });

      if (stepsError) {
        throw new Error(
          `Unable to read department approval chain steps: ${stepsError.message}`,
        );
      }

      return (
        steps?.map((step) => ({
          stepNumber: step.step_number,
          sourceType: step.source_type,
          userId: step.user_id,
          titleKey: step.title_key,
          isBlocking: step.is_blocking,
        })) ?? null
      );
    },
    async getActiveUserId(userId) {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to read user by id: ${error.message}`);
      }

      return data?.id ?? null;
    },
  };
}

export function createApprovalRoutingDependencies(
  repository: ApprovalRoutingRepository,
): ApprovalRoutingDependencies {
  return {
    getClubAdviser: (entityId) =>
      getRequiredEntityHeadUser(repository, entityId, "Club Adviser"),
    getHouseMentor: (entityId) =>
      getRequiredEntityHeadUser(repository, entityId, "House Mentor"),
    getSubmittingCoach: (entityId) =>
      getRequiredEntityHeadUser(repository, entityId, "PE Teacher/Coach"),
    getConfiguredDepartmentChain: async (entityId, gradeLevel) => {
      const configuredSteps = await repository.getActiveDepartmentChainSteps?.(
        entityId,
        gradeLevel,
      );

      if (!configuredSteps?.length) {
        return null;
      }

      const approverIds: string[] = [];

      for (const step of configuredSteps) {
        if (!step.isBlocking) {
          continue;
        }

        switch (step.sourceType) {
          case "entity_head":
            approverIds.push(
              await getRequiredEntityHeadUser(
                repository,
                entityId,
                `Configured approval step ${step.stepNumber}`,
              ),
            );
            break;
          case "specific_user":
            approverIds.push(
              await getRequiredActiveUserId(
                repository,
                step.userId,
                `Configured approval step ${step.stepNumber}`,
              ),
            );
            break;
          case "title_lookup":
            approverIds.push(
              await getRequiredUserByTitle(
                repository,
                [step.titleKey ?? ""],
                `Configured approval step ${step.stepNumber}`,
              ),
            );
            break;
          default: {
            const exhaustiveCheck: never = step.sourceType;
            throw new Error(`Unsupported configured step source: ${exhaustiveCheck}`);
          }
        }
      }

      return approverIds.length > 0 ? approverIds : null;
    },
    getTarbiyahDirector: () =>
      getRequiredUserByTitle(repository, ["Tarbiyah Director"], "Tarbiyah Director"),
    getAthleticDirector: () =>
      getRequiredUserByTitle(repository, ["Athletic Director"], "Athletic Director"),
    getDepartmentHead: (entityId) =>
      getRequiredEntityHeadUser(repository, entityId, "Department Head"),
    getHSPrincipal: () =>
      getRequiredUserByTitle(
        repository,
        ["HS Principal", "Head of School"],
        "HS Principal",
      ),
    getMSPrincipal: () =>
      getRequiredUserByTitle(repository, ["MS Principal"], "MS Principal"),
    getFacilitiesDirector: () =>
      getRequiredUserByTitle(
        repository,
        ["Facilities Director"],
        "Facilities Director",
      ),
  };
}

export async function getClubAdviser(
  repository: ApprovalRoutingRepository,
  entityId: string,
) {
  return getRequiredEntityHeadUser(repository, entityId, "Club Adviser");
}

export async function getHouseMentor(
  repository: ApprovalRoutingRepository,
  entityId: string,
) {
  return getRequiredEntityHeadUser(repository, entityId, "House Mentor");
}

export async function getSubmittingCoach(
  repository: ApprovalRoutingRepository,
  entityId: string,
) {
  return getRequiredEntityHeadUser(repository, entityId, "PE Teacher/Coach");
}

export async function getTarbiyahDirector(repository: ApprovalRoutingRepository) {
  return getRequiredUserByTitle(
    repository,
    ["Tarbiyah Director"],
    "Tarbiyah Director",
  );
}

export async function getAthleticDirector(repository: ApprovalRoutingRepository) {
  return getRequiredUserByTitle(
    repository,
    ["Athletic Director"],
    "Athletic Director",
  );
}

export async function getDepartmentHead(
  repository: ApprovalRoutingRepository,
  entityId: string,
) {
  return getRequiredEntityHeadUser(repository, entityId, "Department Head");
}

export async function getHSPrincipal(repository: ApprovalRoutingRepository) {
  return getRequiredUserByTitle(
    repository,
    ["HS Principal", "Head of School"],
    "HS Principal",
  );
}

export async function getMSPrincipal(repository: ApprovalRoutingRepository) {
  return getRequiredUserByTitle(repository, ["MS Principal"], "MS Principal");
}

export async function getFacilitiesDirector(
  repository: ApprovalRoutingRepository,
) {
  return getRequiredUserByTitle(
    repository,
    ["Facilities Director"],
    "Facilities Director",
  );
}

export async function buildApprovalChain(
  entityType: EntityType,
  entityId: string,
  gradeLevel: GradeLevel,
  dependencies: ApprovalRoutingDependencies,
): Promise<ApprovalChainResult> {
  const approverIds: string[] = [];

  switch (entityType) {
    case "club":
      approverIds.push(await dependencies.getClubAdviser(entityId));
      approverIds.push(await dependencies.getHSPrincipal());
      break;
    case "house":
      approverIds.push(await dependencies.getHouseMentor(entityId));
      approverIds.push(await dependencies.getTarbiyahDirector());
      approverIds.push(await dependencies.getHSPrincipal());
      break;
    case "athletics":
      approverIds.push(await dependencies.getSubmittingCoach(entityId));
      approverIds.push(await dependencies.getAthleticDirector());
      approverIds.push(await dependencies.getHSPrincipal());
      break;
    case "department":
      {
        const configuredDepartmentChain =
          await dependencies.getConfiguredDepartmentChain(
            entityId,
            toDepartmentChainGradeLevel(gradeLevel),
          );

        if (configuredDepartmentChain?.length) {
          approverIds.push(...configuredDepartmentChain);
          break;
        }

        approverIds.push(await dependencies.getDepartmentHead(entityId));
        approverIds.push(
          gradeLevel === "MS"
            ? await dependencies.getMSPrincipal()
            : await dependencies.getHSPrincipal(),
        );
      }
      break;
    default: {
      const exhaustiveCheck: never = entityType;
      throw new Error(`Unsupported entity type: ${exhaustiveCheck}`);
    }
  }

  return {
    approverIds,
    ccUserId: await dependencies.getFacilitiesDirector(),
  };
}

function toDepartmentChainGradeLevel(gradeLevel: GradeLevel): "MS" | "HS" {
  return gradeLevel === "MS" ? "MS" : "HS";
}

async function getRequiredEntityHeadUser(
  repository: ApprovalRoutingRepository,
  entityId: string,
  roleLabel: string,
) {
  const userId = await repository.getEntityHeadUserId(entityId);

  if (!userId) {
    throw new Error(`${roleLabel} is not assigned for entity ${entityId}.`);
  }

  return userId;
}

async function getRequiredUserByTitle(
  repository: ApprovalRoutingRepository,
  titles: string[],
  roleLabel: string,
) {
  const userId = await repository.getUserIdByTitle(titles);

  if (!userId) {
    throw new Error(`${roleLabel} user is not configured.`);
  }

  return userId;
}

async function getRequiredActiveUserId(
  repository: ApprovalRoutingRepository,
  userId: string | null,
  roleLabel: string,
) {
  if (!userId) {
    throw new Error(`${roleLabel} is not configured.`);
  }

  const resolvedUserId = await repository.getActiveUserId?.(userId);

  if (!resolvedUserId) {
    throw new Error(`${roleLabel} user is not active.`);
  }

  return resolvedUserId;
}
