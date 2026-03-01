"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/shared/form-error";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { createClient } from "@/lib/supabase/client";
import {
  updatePasswordFormSchema,
  type UpdatePasswordFormValues,
} from "@/lib/utils/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordFormSchema),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setToast(null);
        startTransition(async () => {
          const supabase = createClient();
          const { error: updateError } = await supabase.auth.updateUser({
            password: values.password,
          });

          if (updateError) {
            setToast(updateError.message);
            return;
          }

          router.replace("/dashboard");
          router.refresh();
        });
      })}
    >
      {toast ? (
        <AppToast
          title="Password update failed"
          description={toast}
          variant="error"
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="Choose a strong password"
          {...register("password")}
        />
        <FormError message={errors.password?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the new password"
          {...register("confirmPassword")}
        />
        <FormError message={errors.confirmPassword?.message} />
      </div>
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? <LoadingLabel label="Updating..." /> : "Update password"}
      </Button>
    </form>
  );
}
