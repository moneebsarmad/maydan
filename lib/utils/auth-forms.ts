import { z } from "zod";

const schoolEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .refine(
    (email) => email.toLowerCase().endsWith("@bhaprep.org"),
    "Use a BHA Prep email address.",
  );

export const loginFormSchema = z.object({
  email: schoolEmailSchema,
  password: z.string().min(1, "Password is required."),
});

export const resetPasswordFormSchema = z.object({
  email: schoolEmailSchema,
});

export const updatePasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm the new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;
