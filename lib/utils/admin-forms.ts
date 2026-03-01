import { z } from "zod";
import type { UserRole } from "@/types";

const roleOptions = ["staff", "approver", "viewer", "admin"] as const;
export const entityTypeOptions = [
  "club",
  "house",
  "department",
  "athletics",
] as const;
export const gradeLevelOptions = ["MS", "HS", "Both"] as const;

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
  entityId: trimmedOptionalUuid,
});

export const updateUserFormSchema = z.object({
  userId: z.string().uuid("User not found."),
  name: z.string().trim().min(1, "Full name is required."),
  role: z.enum(roleOptions, {
    required_error: "Select a role.",
  }),
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

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;
export type CreateEntityFormValues = z.infer<typeof createEntityFormSchema>;
export type UpdateEntityFormValues = z.infer<typeof updateEntityFormSchema>;
export type CreateFacilityFormValues = z.infer<typeof createFacilityFormSchema>;
export type UpdateFacilityFormValues = z.infer<typeof updateFacilityFormSchema>;
export type AdminRoleOption = UserRole;

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid form submission.";
}
