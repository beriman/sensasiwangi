import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/forum";
import { ForumNotification } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notificationsData = await getNotifications(user.id);
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Gagal menandai notifikasi sebagai telah dibaca.",
        variant: "destructive",
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );

      setUnreadCount(0);

      toast({
        title: "Berhasil",
        description: "Semua notifikasi telah ditandai sebagai dibaca.",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Gagal menandai semua notifikasi sebagai telah dibaca.",
        variant: "destructive",
      });
    }
  };

  // Get notification link based on type
  const getNotificationLink = (notification: ForumNotification) => {
    switch (notification.type) {
      case "reply":
        return `/forum/thread/${notification.thread_id}#reply-${notification.reply_id}`;
      case "mention":
        return notification.reply_id
          ? `/forum/thread/${notification.thread_id}#reply-${notification.reply_id}`
          : `/forum/thread/${notification.thread_id}`;
      case "vote":
        return notification.reply_id
          ? `/forum/thread/${notification.thread_id}#reply-${notification.reply_id}`
          : `/forum/thread/${notification.thread_id}`;
      case "level_up":
        return `/profile`;
      default:
        return `/forum`;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reply":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm">💬</span>
          </div>
        );
      case "mention":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm">@</span>
          </div>
        );
      case "vote":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 text-sm">👍</span>
          </div>
        );
      case "level_up":
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-600 text-sm">⭐</span>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-600 text-sm">📢</span>
          </div>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="px-4 py-2">
                  <div
                    className={`flex gap-3 ${!notification.read ? "bg-purple-50 -mx-4 px-4 py-2 rounded" : ""}`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <Link
                        to={getNotificationLink(notification)}
                        className="text-sm font-medium hover:text-purple-700"
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id);
                          }
                          setOpen(false);
                        }}
                      >
                        {notification.message}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
