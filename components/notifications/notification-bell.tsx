import { Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";

export async function NotificationBell() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, event_id, message, read, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const unreadCount = (notifications ?? []).filter(
    (notification) => !notification.read,
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-950 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          type="button"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-bold text-slate-950">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <NotificationDropdown
        notifications={(notifications ?? []).map((notification) => ({
          id: notification.id,
          eventId: notification.event_id,
          message: notification.message,
          read: notification.read ?? false,
          createdAt: notification.created_at,
        }))}
        unreadCount={unreadCount}
        userId={user.id}
      />
    </DropdownMenu>
  );
}
