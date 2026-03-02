import { z } from "zod";
import type { ApprovalChainStepSource, UserRole } from "@/types";

const roleOptions = ["staff", "approver", "viewer", "admin"] as const;
export const entityTypeOptions = [
  "club",
  "house",
  "department",
  "athletics",
] as const;
export const gradeLevelOptions = ["MS", "HS", "Both"] as const;
export const departmentChainGradeLevelOptions = ["MS", "HS"] as const;
export const approvalChainStepSourceOptions = [
  "entity_head",
  "specific_user",
  "title_lookup",
] as const satisfies readonly ApprovalChainStepSource[];

const trimmedOptionalUuid = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}, z.string().uuid("Select a valid entity.").optional());

const trimmedOptionalString = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}, z.string().optional());

const trimmedOptionalNumber = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : value;
}, z.number().int().min(0, "Capacity must be 0 or greater.").optional());

const schoolEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .refine(
    (email) => email.toLowerCase().endsWith("@bhaprep.org"),
    "Use a BHA Prep email address.",
  );

export const inviteUserFormSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  email: schoolEmailSchema,
  role: z.enum(roleOptions, {
    required_error: "Select a role.",
  }),
  title: trimmedOptionalString,
  entityId: trimmedOptionalUuid,
});

export const updateUserFormSchema = z.object({
  userId: z.string().uuid("User not found."),
  name: z.string().trim().min(1, "Full name is required."),
  role: z.enum(roleOptions, {
    required_error: "Select a role.",
  }),
  title: trimmedOptionalString,
  entityId: trimmedOptionalUuid,
});

export const createEntityFormSchema = z.object({
  name: z.string().trim().min(1, "Entity name is required."),
  type: z.enum(entityTypeOptions, {
    required_error: "Select an entity type.",
  }),
  gradeLevel: z.enum(gradeLevelOptions).optional().or(z.literal("")),
});

export const updateEntityFormSchema = z.object({
  entityId: z.string().uuid("Entity not found."),
  name: z.string().trim().min(1, "Entity name is required."),
  type: z.enum(entityTypeOptions, {
    required_error: "Select an entity type.",
  }),
  gradeLevel: z.enum(gradeLevelOptions).optional().or(z.literal("")),
  headUserId: trimmedOptionalUuid,
});

export const createFacilityFormSchema = z.object({
  name: z.string().trim().min(1, "Facility name is required."),
  capacity: trimmedOptionalNumber,
  notes: trimmedOptionalString,
});

export const updateFacilityFormSchema = z.object({
  facilityId: z.string().uuid("Facility not found."),
  name: z.string().trim().min(1, "Facility name is required."),
  capacity: trimmedOptionalNumber,
  notes: trimmedOptionalString,
});

export const approvalChainStepFormSchema = z
  .object({
    id: z.string().uuid("Step not found.").optional(),
    sourceType: z.enum(approvalChainStepSourceOptions, {
      required_error: "Select a step source type.",
    }),
    userId: trimmedOptionalUuid,
    titleKey: trimmedOptionalString,
    labelOverride: trimmedOptionalString,
  })
  .superRefine((value, context) => {
    if (value.sourceType === "entity_head") {
      return;
    }

    if (value.sourceType === "specific_user" && !value.userId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select an approver for a specific-user step.",
        path: ["userId"],
      });
    }

    if (value.sourceType === "title_lookup" && !value.titleKey) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a title for a title-lookup step.",
        path: ["titleKey"],
      });
    }
  });

export const departmentApprovalChainFormSchema = z.object({
  templateId: z.string().uuid("Chain not found.").optional(),
  name: z.string().trim().min(1, "Chain name is required."),
  entityId: z.string().uuid("Department is required."),
  gradeLevel: z.enum(departmentChainGradeLevelOptions, {
    required_error: "Select HS or MS.",
  }),
  active: z.boolean(),
  steps: z
    .array(approvalChainStepFormSchema)
    .min(1, "At least one approval step is required.")
    .max(5, "Keep approval chains to five steps or fewer."),
});

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;
export type CreateEntityFormValues = z.infer<typeof createEntityFormSchema>;
export type UpdateEntityFormValues = z.infer<typeof updateEntityFormSchema>;
export type CreateFacilityFormValues = z.infer<typeof createFacilityFormSchema>;
export type UpdateFacilityFormValues = z.infer<typeof updateFacilityFormSchema>;
export type DepartmentApprovalChainFormValues = z.infer<
  typeof departmentApprovalChainFormSchema
>;
export type DepartmentApprovalChainStepFormValues = z.infer<
  typeof approvalChainStepFormSchema
>;
export type AdminRoleOption = UserRole;

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid form submission.";
}
