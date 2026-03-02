"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: "/admin/users",
    label: "Users",
  },
  {
    href: "/admin/entities",
    label: "Entities",
  },
  {
    href: "/admin/facilities",
    label: "Facilities",
  },
  {
    href: "/admin/approval-chains",
    label: "Chains",
  },
  {
    href: "/admin/audit",
    label: "Audit",
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {adminLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "border-amber-300 bg-amber-100 text-amber-950"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
