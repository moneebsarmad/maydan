import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { UpdatePasswordForm } from "@/components/shared/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      eyebrow="Back to login"
      title="Create a new password"
      description="Choose a secure password to complete your Maydan account setup."
      footer={
        <p>
          Need a fresh link?{" "}
          <Link className="font-semibold text-slate-950" href="/reset-password">
            Request another reset email
          </Link>
        </p>
      }
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
