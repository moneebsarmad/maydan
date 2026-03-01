import { AuthProvider } from "@/components/shared/auth-provider";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { RealtimeListeners } from "@/components/shared/realtime-listeners";
import { AppHeader } from "@/components/shared/top-header";
import { getShellUser } from "@/lib/supabase/get-shell-user";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getShellUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 p-6">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700">
            Account setup required
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            No Maydan profile found for this authenticated user.
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-600">
            Supabase Auth is active, but this account does not have a matching
            row in the `users` table yet. Finish the Phase 3 admin user
            provisioning step before continuing with protected routes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider user={user}>
      <div className="min-h-screen bg-stone-100 text-slate-950">
        <RealtimeListeners role={user.role} userId={user.id} />
        <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
          <AppSidebar role={user.role} />
          <div className="flex min-h-screen flex-col">
            <AppHeader user={user} />
            <div className="border-b border-stone-200 bg-white/70 px-4 py-4 backdrop-blur lg:hidden">
              <AppSidebar role={user.role} mobile />
            </div>
            <main className="flex-1 px-4 py-6 md:px-6 lg:px-10 lg:py-10">{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
