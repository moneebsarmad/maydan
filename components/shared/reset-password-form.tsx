"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const redirectTo = `${
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        }/update-password`;

        startTransition(async () => {
          const supabase = createClient();
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            email,
            { redirectTo },
          );

          if (resetError) {
            setError(resetError.message);
            return;
          }

          setSuccess("Reset link sent. Check your email inbox.");
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="reset-email">School email</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@bhaprep.org"
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? (
        <p className="text-sm font-medium text-emerald-700">{success}</p>
      ) : null}
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
