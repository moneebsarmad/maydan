"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/shared/form-error";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/utils/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setToast(null);
        const redirectTo = `${
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        }/update-password`;

        startTransition(async () => {
          const supabase = createClient();
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            values.email,
            { redirectTo },
          );

          if (resetError) {
            setToast({
              title: "Reset failed",
              description: resetError.message,
              variant: "error",
            });
            return;
          }

          setToast({
            title: "Reset link sent",
            description: "Check your email inbox for the password reset link.",
            variant: "success",
          });
        });
      })}
    >
      {toast ? (
        <AppToast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="reset-email">School email</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="name@bhaprep.org"
          {...register("email")}
        />
        <FormError message={errors.email?.message} />
      </div>
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? <LoadingLabel label="Sending..." /> : "Send reset link"}
      </Button>
    </form>
  );
}
