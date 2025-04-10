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
  CheckCheck,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { formatDistanceToNow, format } from "date-fns";
import MainLayout from "../layout/MainLayout";
import NotificationPreferences from "../notifications/NotificationPreferences";

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

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [markingAsRead, setMarkingAsRead] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up real-time subscription for new notifications
      const notificationsSubscription = supabase
        .channel('notifications-page-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Update notifications
            fetchNotifications();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(notificationsSubscription);
      };
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_user_notifications',
        {
          user_id_param: user.id,
          limit_param: 50,
          offset_param: 0,
          unread_only: false
        }
      );
      
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
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
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case "thread_update":
        return <RefreshCw className="h-5 w-5 text-green-500" />;
      case "vote":
        return <ThumbsUp className="h-5 w-5 text-amber-500" />;
      case "thread_subscription":
        return <Bell className="h-5 w-5 text-indigo-500" />;
      case "direct_message":
        return <Mail className="h-5 w-5 text-pink-500" />;
      case "system_announcement":
        return <Megaphone className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5" />;
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
  const unreadCount = notifications.filter(notification => !notification.is_read).length;
  
  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4 mr-1" />
              {showPreferences ? "Hide" : "Show"} Preferences
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={markingAsRead || unreadCount === 0}
            >
              {markingAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-1" />
              )}
              Mark all as read
            </Button>
          </div>
        </div>
        
        {showPreferences && (
          <div className="mb-6">
            <NotificationPreferences />
          </div>
        )}
        
        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Notifications</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading notifications..." />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-md transition-colors ${!notification.is_read ? 'bg-blue-50/50 border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type_id, notification.type_icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{notification.title}</p>
                          <span className="text-sm text-gray-500">
                            {format(new Date(notification.created_at), "PPp")}
                          </span>
                        </div>
                        {notification.content && (
                          <p className="text-gray-600 mt-1">{notification.content}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {notification.link && (
                              <Link 
                                to={notification.link} 
                                className="text-sm text-blue-600 hover:underline"
                                onClick={() => {
                                  if (!notification.is_read) {
                                    markAsRead(notification.id);
                                  }
                                }}
                              >
                                View
                              </Link>
                            )}
                            
                            <Badge variant="outline" className="text-xs">
                              {notification.type_name}
                            </Badge>
                          </div>
                          
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {activeTab === "all" ? (
                  <>
                    <Bell className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="text-xl text-gray-500 font-medium">No notifications</p>
                    <p className="text-gray-400 mt-1 max-w-md">
                      You don't have any notifications yet. Notifications will appear here when you receive them.
                    </p>
                  </>
                ) : (
                  <>
                    <Check className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="text-xl text-gray-500 font-medium">No unread notifications</p>
                    <p className="text-gray-400 mt-1">
                      You're all caught up!
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
