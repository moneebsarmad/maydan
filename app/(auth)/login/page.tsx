import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { LoginForm } from "@/components/shared/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Back to overview"
      title="Staff login"
      description="Use your BHA Prep email address and password to access your Maydan dashboard."
      footer={
        <p>
          Need to reset your password?{" "}
          <Link className="font-semibold text-slate-950" href="/reset-password">
            Open password reset
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-500">
            School credentials only
          </span>
          <Link
            className="text-sm font-medium text-stone-500 transition hover:text-slate-950"
            href="/reset-password"
          >
            Forgot password?
          </Link>
        </div>
        <LoginForm />
      </div>
    </AuthShell>
  );
}
