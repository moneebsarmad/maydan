import { z } from "zod";
import type { UserRole } from "@/types";

const roleOptions = ["submitter", "approver", "viewer", "admin"] as const;

const trimmedOptionalUuid = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}, z.string().uuid("Select a valid entity.").optional());

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

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;
export type AdminRoleOption = UserRole;

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid form submission.";
}
