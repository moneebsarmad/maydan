import { BellDot, ShieldCheck } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LogoutButton } from "@/components/shared/logout-button";
import type { ShellUser } from "@/components/shared/shell-types";
import { UserAvatar } from "@/components/shared/user-avatar";

interface AppHeaderProps {
  user: ShellUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6 lg:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            School Event Management
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Dashboard Shell
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role} mode
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600 md:flex md:items-center md:gap-2">
            <BellDot className="h-4 w-4 text-amber-700" />
            UI shell only until Phase 3 auth wiring.
          </div>
          <NotificationBell />
          <UserAvatar name={user.name} email={user.email} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
