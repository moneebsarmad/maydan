"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
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
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        startTransition(async () => {
          try {
            const supabase = createClient();
            const { data, error: signInError } =
              await supabase.auth.signInWithPassword({
                email,
                password,
              });

            if (signInError) {
              setError(signInError.message);
              return;
            }

            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("active")
              .eq("id", data.user.id)
              .maybeSingle();

            if (profileError || !profile?.active) {
              await supabase.auth.signOut();
              setError(
                profileError?.message ||
                  "This account is not active in Maydan. Contact an administrator.",
              );
              return;
            }

            router.replace("/dashboard");
            router.refresh();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to sign in right now.",
            );
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">School email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@bhaprep.org"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      <Button className="w-full justify-center" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
