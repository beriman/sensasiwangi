import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  Loader2,
  MessageSquare,
  AtSign,
  RefreshCw,
  ThumbsUp,
  Mail,
  Megaphone,
  Settings,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type_id: string;
  type_name: string;
  type_icon: string;
  type_color: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [markingAsRead, setMarkingAsRead] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      // Set up real-time subscription for new notifications
      const notificationsSubscription = supabase
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Update notifications and unread count
            fetchNotifications();
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSubscription);
      };
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'get_user_notifications',
        {
          user_id_param: user.id,
          limit_param: 20,
          offset_param: 0,
          unread_only: false
        }
      );

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc(
        'get_unread_notification_count',
        { user_id_param: user.id }
      );

      if (error) throw error;

      setUnreadCount(data || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc(
        'mark_notification_as_read',
        {
          notification_id_param: notificationId,
          user_id_param: user.id
        }
      );

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ));

      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      setMarkingAsRead(true);

      const { error } = await supabase.rpc(
        'mark_all_notifications_as_read',
        { user_id_param: user.id }
      );

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);

      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getNotificationIcon = (typeId: string, typeIcon: string) => {
    switch (typeId) {
      case "new_reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case "thread_update":
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      case "vote":
        return <ThumbsUp className="h-4 w-4 text-amber-500" />;
      case "thread_subscription":
        return <Bell className="h-4 w-4 text-indigo-500" />;
      case "direct_message":
        return <Mail className="h-4 w-4 text-pink-500" />;
      case "system_announcement":
        return <Megaphone className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") {
      return notifications;
    } else if (activeTab === "unread") {
      return notifications.filter(notification => !notification.is_read);
    }
    return [];
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <Link to="/notifications/preferences">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={markAllAsRead}
              disabled={markingAsRead || unreadCount === 0}
            >
              {markingAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-1" />
              )}
              Mark all read
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 p-0 h-10 rounded-none border-b">
            <TabsTrigger value="all" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" text="Loading notifications..." />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type_id, notification.type_icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {notification.link ? (
                              <Link
                                to={notification.link}
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => {
                                  if (!notification.is_read) {
                                    markAsRead(notification.id);
                                  }
                                  setIsOpen(false);
                                }}
                              >
                                View
                              </Link>
                            ) : (
                              <span></span>
                            )}

                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  You don't have any notifications yet
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" text="Loading notifications..." />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors bg-blue-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type_id, notification.type_icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {notification.link ? (
                              <Link
                                to={notification.link}
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                              >
                                View
                              </Link>
                            ) : (
                              <span></span>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Check className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No unread notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  You're all caught up!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-2 border-t text-center">
          <Link
            to="/notifications"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationCenter };
export default NotificationCenter;
