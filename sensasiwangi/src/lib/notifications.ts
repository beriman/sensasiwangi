import { supabase } from "../../supabase/supabase";
import { NotificationItemProps } from "../components/forum/NotificationItem";

// Get user notifications
export async function getUserNotifications(
  userId: string,
): Promise<NotificationItemProps[]> {
  try {
    const { data, error } = await supabase
      .from("forum_notifications")
      .select(
        `
        id,
        type,
        content,
        thread_id,
        is_read,
        created_at,
        threads(title),
        users(id, avatar_url, username)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      content: notification.content,
      threadId: notification.thread_id,
      threadTitle: notification.threads?.title,
      createdAt: notification.created_at,
      isRead: notification.is_read,
      userId: notification.users?.id,
      userAvatar: notification.users?.avatar_url,
      userName: notification.users?.username,
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("forum_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("forum_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("forum_notifications")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

