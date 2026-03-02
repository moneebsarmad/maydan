import { ApprovalChainsAdminShell } from "@/components/admin/approval-chains-admin-shell";
import {
  getDepartmentChainGradeLevels,
  type DepartmentChainGradeLevel,
} from "@/lib/approval-chains/department-approval-chain-utils";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalChainStepSource, GradeLevel } from "@/types";

interface DepartmentChainSlot {
  slotId: string;
  entityId: string;
  departmentName: string;
  entityGradeLevel: GradeLevel | null;
  gradeLevel: DepartmentChainGradeLevel;
  headUserId: string | null;
  headUserName: string;
  template: {
    id: string;
    name: string;
    active: boolean;
    updatedAt: string | null;
    steps: Array<{
      id: string;
      sourceType: ApprovalChainStepSource;
      userId: string | null;
      titleKey: string | null;
      labelOverride: string | null;
      isBlocking: boolean;
    }>;
  } | null;
}

type DepartmentChainTemplateStep = NonNullable<
  DepartmentChainSlot["template"]
>["steps"][number];

interface ApproverOption {
  id: string;
  name: string;
  title: string | null;
}

export default async function AdminApprovalChainsPage() {
  const supabase = createClient();
  const [
    { data: departments },
    { data: templates },
    { data: templateSteps },
    { data: approverUsers },
  ] = await Promise.all([
    supabase
      .from("entities")
      .select(
        "id, name, grade_level, head_user_id, head_user:users!entities_head_user_id_fkey(name)",
      )
      .eq("type", "department")
      .order("name"),
    supabase
      .from("approval_chain_templates")
      .select("id, name, entity_id, grade_level, active, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("approval_chain_template_steps")
      .select(
        "id, template_id, step_number, source_type, user_id, title_key, label_override, is_blocking",
      )
      .order("step_number", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, title")
      .eq("active", true)
      .in("role", ["approver", "admin"])
      .order("name"),
  ]);

  const stepsByTemplateId = new Map<
    string,
    DepartmentChainTemplateStep[]
  >();

  for (const step of templateSteps ?? []) {
    const currentSteps = stepsByTemplateId.get(step.template_id) ?? [];
    currentSteps.push({
      id: step.id,
      sourceType: step.source_type,
      userId: step.user_id,
      titleKey: step.title_key,
      labelOverride: step.label_override,
      isBlocking: step.is_blocking,
    });
    stepsByTemplateId.set(step.template_id, currentSteps);
  }

  const templatesBySlot = new Map<
    string,
    NonNullable<DepartmentChainSlot["template"]>
  >();

  for (const template of templates ?? []) {
    const slotId = buildSlotId(template.entity_id, template.grade_level);
    templatesBySlot.set(slotId, {
      id: template.id,
      name: template.name,
      active: template.active,
      updatedAt: template.updated_at,
      steps: stepsByTemplateId.get(template.id) ?? [],
    });
  }

  const slots: DepartmentChainSlot[] =
    departments?.flatMap((department) => {
      const headUser = Array.isArray(department.head_user)
        ? department.head_user[0]
        : null;

      return getDepartmentChainGradeLevels(
        department.grade_level as GradeLevel | null,
      ).map((gradeLevel) => ({
        slotId: buildSlotId(department.id, gradeLevel),
        entityId: department.id,
        departmentName: department.name,
        entityGradeLevel: department.grade_level as GradeLevel | null,
        gradeLevel,
        headUserId: department.head_user_id,
        headUserName: headUser?.name ?? "Unassigned",
        template: templatesBySlot.get(buildSlotId(department.id, gradeLevel)) ?? null,
      }));
    }) ?? [];

  return (
    <ApprovalChainsAdminShell
      approverUsers={
        approverUsers?.map((user) => ({
          id: user.id,
          name: user.name,
          title: user.title,
        })) ?? []
      }
      slots={slots}
    />
  );
}

function buildSlotId(entityId: string, gradeLevel: DepartmentChainGradeLevel) {
  return `${entityId}:${gradeLevel}`;
}
