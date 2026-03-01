import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { ResetPasswordForm } from "@/components/shared/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Back to login"
      title="Reset password"
      description="Enter your BHA Prep email and Maydan will send a password reset link."
      footer={
        <p>
          Remembered your password?{" "}
          <Link className="font-semibold text-slate-950" href="/login">
            Return to login
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
