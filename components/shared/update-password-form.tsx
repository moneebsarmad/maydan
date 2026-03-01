"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        startTransition(async () => {
          const supabase = createClient();
          const { error: updateError } = await supabase.auth.updateUser({
            password,
          });

          if (updateError) {
            setError(updateError.message);
            return;
          }

          router.replace("/dashboard");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Choose a strong password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the new password"
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
