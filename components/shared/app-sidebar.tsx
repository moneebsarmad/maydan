"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Settings2,
  TicketPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShellRole } from "@/components/shared/shell-types";

interface AppSidebarProps {
  role: ShellRole;
  mobile?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: ShellRole[];
  activePrefix?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["submitter", "approver", "viewer", "admin"],
  },
  {
    label: "Events",
    href: "/events",
    icon: TicketPlus,
    roles: ["submitter", "approver", "viewer", "admin"],
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    roles: ["approver", "admin"],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    roles: ["submitter", "approver", "viewer", "admin"],
  },
  {
    label: "Admin",
    href: "/admin/users",
    icon: Settings2,
    roles: ["admin"],
    activePrefix: "/admin",
  },
] as const;

export function AppSidebar({ role, mobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  if (mobile) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.activePrefix ?? item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "border-amber-300 bg-amber-100 text-amber-950"
                  : "border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="hidden border-r border-stone-200 bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#1e293b_100%)] px-6 py-8 text-white lg:block">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
          BHA Prep
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Maydan</h1>
        <p className="mt-3 text-sm text-slate-300">
          Internal event coordination and approval routing.
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.activePrefix ?? item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/20"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
          Role-aware nav
        </p>
        <p className="mt-3 text-sm text-slate-200">
          Approvals are hidden for pure submitters. Admin is hidden for
          non-admin roles.
        </p>
      </div>
    </aside>
  );
}
