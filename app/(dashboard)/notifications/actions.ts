"use server";

import { createClient } from "@/lib/supabase/server";

export async function createNotification(
  userId: string,
  eventId: string,
  message: string,
) {
  const supabase = createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    event_id: eventId,
    message,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAsRead(notificationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllAsRead(userId?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  if (userId && userId !== user.id) {
    throw new Error("Cannot mark notifications for another user.");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    throw new Error(error.message);
  }
}
