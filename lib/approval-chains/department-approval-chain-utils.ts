import type {
  ApprovalChainStepSource,
  GradeLevel,
} from "@/types";

export type DepartmentChainGradeLevel = "MS" | "HS";

export interface DepartmentApprovalChainEditorStep {
  id?: string;
  sourceType: ApprovalChainStepSource;
  userId?: string;
  titleKey?: string;
  labelOverride?: string;
}

export function getDepartmentChainGradeLevels(
  entityGradeLevel: GradeLevel | null,
): DepartmentChainGradeLevel[] {
  if (entityGradeLevel === "MS") {
    return ["MS"];
  }

  if (entityGradeLevel === "HS") {
    return ["HS"];
  }

  return ["HS", "MS"];
}

export function normalizeDepartmentChainGradeLevel(
  gradeLevel: GradeLevel,
): DepartmentChainGradeLevel {
  return gradeLevel === "MS" ? "MS" : "HS";
}

export function buildDefaultDepartmentChainName(
  departmentName: string,
  gradeLevel: DepartmentChainGradeLevel,
) {
  return `${departmentName} / ${gradeLevel}`;
}

export function buildFallbackDepartmentChainSummary(
  gradeLevel: DepartmentChainGradeLevel,
) {
  return `Department Head -> ${gradeLevel === "MS" ? "MS Principal" : "HS Principal"}`;
}

export function summarizeDepartmentChainLabels(
  labels: string[],
  gradeLevel: DepartmentChainGradeLevel,
) {
  return labels.length > 0
    ? labels.join(" -> ")
    : buildFallbackDepartmentChainSummary(gradeLevel);
}
