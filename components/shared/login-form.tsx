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
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/utils/auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setToast(null);

        startTransition(async () => {
          try {
            const supabase = createClient();
            const { data, error: signInError } =
              await supabase.auth.signInWithPassword(values);

            if (signInError) {
              setToast(signInError.message);
              return;
            }

            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("active")
              .eq("id", data.user.id)
              .maybeSingle();

            if (profileError || !profile?.active) {
              await supabase.auth.signOut();
              setToast(
                profileError?.message ||
                  "This account is not active in Maydan. Contact an administrator.",
              );
              return;
            }

            router.replace("/dashboard");
            router.refresh();
          } catch (error) {
            setToast(
              error instanceof Error
                ? error.message
                : "Unable to sign in right now.",
            );
          }
        });
      })}
    >
      {toast ? (
        <AppToast
          title="Sign in failed"
          description={toast}
          variant="error"
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">School email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@bhaprep.org"
          {...register("email")}
        />
        <FormError message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          {...register("password")}
        />
        <FormError message={errors.password?.message} />
      </div>
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? <LoadingLabel label="Signing in..." /> : "Sign in"}
      </Button>
    </form>
  );
}
