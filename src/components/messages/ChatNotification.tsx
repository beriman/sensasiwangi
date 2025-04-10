import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface ChatNotification {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_preview: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name?: string;
    avatar_url?: string;
  };
  conversation?: {
    title?: string;
    is_group?: boolean;
  };
}

export default function ChatNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_notifications")
          .select(
            `
            *,
            sender:sender_id(full_name, avatar_url),
            conversation:conversation_id(title, is_group)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.read).length || 0);
      } catch (error) {
        console.error("Error fetching chat notifications:", error);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`chat_notifications_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Fetch the complete notification with sender info
          supabase
            .from("chat_notifications")
            .select(
              `
              *,
              sender:sender_id(full_name, avatar_url),
              conversation:conversation_id(title, is_group)
            `
            )
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setNotifications((prev) => [data, ...prev]);
                setUnreadCount((prev) => prev + 1);

                // Show toast notification
                toast({
                  title: data.sender?.full_name || "Pesan Baru",
                  description: data.message_preview,
                  action: (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate(`/messages/${data.conversation_id}`);
                        markAsRead(data.id);
                      }}
                    >
                      Lihat
                    </Button>
                  ),
                });
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, toast, navigate]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("chat_notifications")
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("chat_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifikasi Chat"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 min-w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifikasi Pesan</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
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
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => {
                  navigate(`/messages/${notification.conversation_id}`);
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  setOpen(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        notification.sender?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.sender_id}`
                      }
                      alt={notification.sender?.full_name || ""}
                    />
                    <AvatarFallback>
                      {notification.sender?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">
                        {notification.conversation?.is_group
                          ? notification.conversation?.title
                          : notification.sender?.full_name || "Pengguna"}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true, locale: id }
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {notification.conversation?.is_group && (
                        <span className="font-medium">
                          {notification.sender?.full_name || "Pengguna"}:{" "}
                        </span>
                      )}
                      {notification.message_preview}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
