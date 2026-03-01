"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { ShellRole } from "@/components/shared/shell-types";

interface RealtimeListenersProps {
  userId: string;
  role: ShellRole;
}

export function RealtimeListeners({
  userId,
  role,
}: RealtimeListenersProps) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current !== null) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        router.refresh();
        refreshTimeoutRef.current = null;
      }, 250);
    };

    const channels = [
      supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          scheduleRefresh,
        )
        .subscribe(),
    ];

    if (role === "submitter") {
      channels.push(
        supabase
          .channel(`submitter-events:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "events",
              filter: `submitter_id=eq.${userId}`,
            },
            scheduleRefresh,
          )
          .subscribe(),
      );
    }

    if (role === "approver") {
      channels.push(
        supabase
          .channel(`approver-queue:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "approval_steps",
              filter: `approver_id=eq.${userId}`,
            },
            scheduleRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "events",
            },
            scheduleRefresh,
          )
          .subscribe(),
      );
    }

    if (role === "admin") {
      channels.push(
        supabase
          .channel("admin-approval-queue")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "approval_steps",
            },
            scheduleRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "events",
            },
            scheduleRefresh,
          )
          .subscribe(),
      );
    }

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [role, router, userId]);

  return null;
}
