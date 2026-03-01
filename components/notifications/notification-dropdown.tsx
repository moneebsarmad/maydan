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
    <div className="absolute right-0 z-20 mt-3 w-96 rounded-3xl border border-stone-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Notifications</p>
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

      {notifications.length > 0 ? (
        <div className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              disabled={isPending}
              onClick={() =>
                handleNotificationClick(notification.id, notification.eventId)
              }
              className={cn(
                "flex w-full items-start gap-2 rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-stone-50",
                notification.read ? "bg-white text-stone-600" : "bg-stone-50 text-stone-800",
              )}
            >
              <Dot
                className={cn(
                  "mt-0.5 h-5 w-5",
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
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
          No notifications yet.
        </div>
      )}
    </div>
  );
}
