"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={cn(
        buttonVariants({ variant: "outline" }),
        "inline-flex items-center gap-2",
      )}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.replace("/login");
          router.refresh();
        });
      }}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
