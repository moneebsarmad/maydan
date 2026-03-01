"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dot } from "lucide-react";
import {
  markAllAsRead,
  markAsRead,
} from "@/app/(dashboard)/notifications/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  notifications: Array<{
    id: string;
    eventId: string | null;
    message: string;
    read: boolean;
    createdAt: string | null;
  }>;
  unreadCount: number;
  userId: string;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  userId,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNotificationClick = (notificationId: string, eventId: string | null) => {
    startTransition(async () => {
      await markAsRead(notificationId);

      if (eventId) {
        router.push(`/events/${eventId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead(userId);
      router.refresh();
    });
  };

  return (
    <DropdownMenuContent align="end" className="w-96 p-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold text-slate-950">
            Notifications
          </DropdownMenuLabel>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
            Unread {unreadCount}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending || unreadCount === 0}
          onClick={handleMarkAllAsRead}
        >
          Mark all read
        </Button>
      </div>

      <DropdownMenuSeparator className="mx-0" />

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "items-start gap-2 rounded-2xl px-3 py-3 text-left text-sm",
                notification.read ? "bg-white text-stone-600" : "bg-stone-50 text-stone-800",
              )}
              disabled={isPending}
              onSelect={(event) => {
                event.preventDefault();
                handleNotificationClick(notification.id, notification.eventId);
              }}
            >
              <Dot
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  notification.read ? "text-stone-300" : "text-amber-600",
                )}
              />
              <div className="min-w-0">
                <p className="leading-6">{notification.message}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
                  {notification.createdAt
                    ? formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })
                    : "recently"}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
          No notifications yet.
        </div>
      )}
    </DropdownMenuContent>
  );
}
