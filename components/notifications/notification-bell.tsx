import { Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
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
    <details className="group relative">
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-stone-200 bg-white text-slate-950 shadow-sm transition hover:border-stone-300 hover:bg-stone-50">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-bold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </summary>
      <div className="hidden group-open:block">
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
      </div>
    </details>
  );
}
