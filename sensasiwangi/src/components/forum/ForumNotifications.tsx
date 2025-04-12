// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
import {
  Bell,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AtSign,
  Eye,
} from "lucide-react";
// @ts-ignore
import { ForumNotification } from "../../types/forum";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../lib/forum";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { id } from "date-fns/locale";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";

export default function ForumNotifications() {
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(user.id);
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const subscription = supabase
      .channel("forum_notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Add the new notification to the list
          const newNotification = payload.new as ForumNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleNotificationClick = async (notification: ForumNotification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to the relevant page
    setOpen(false);
    if (notification.thread_id) {
      navigate(`/forum/thread/${notification.thread_id}`);
    } else if (notification.reply_id) {
      navigate(
        `/forum/thread/${notification.thread_id}#reply-${notification.reply_id}`,
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead(user!.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case "vote":
        return notification.message.includes("cendol") ? (
          <ThumbsUp className="h-4 w-4 text-green-500" />
        ) : (
          <ThumbsDown className="h-4 w-4 text-red-500" />
        );
      case "follow":
        return <Eye className="h-4 w-4 text-amber-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-pink-500" />;
      case "level_up":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
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
              className="h-8 text-xs"
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Belum ada notifikasi
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: id,
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


