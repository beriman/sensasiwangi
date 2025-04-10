import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  CheckCircle,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import NotificationItem from "./NotificationItem";

interface NotificationData {
  id: string;
  user_id: string;
  type: "badge" | "achievement" | "challenge" | "leaderboard" | "level_up" | "system";
  title: string;
  message: string;
  icon?: string;
  color?: string;
  link?: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up realtime subscription
      const subscription = supabase
        .channel('user_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Refresh notifications when there's a change
            fetchNotifications();
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      // Call the RPC function to mark notification as read
      const { error } = await supabase.rpc(
        'mark_notifications_as_read',
        {
          user_id_param: user.id,
          notification_ids: [notificationId]
        }
      );
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, is_read: true };
        }
        return notification;
      }));
      
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      // Call the RPC function to mark all notifications as read
      const { error } = await supabase.rpc(
        'mark_notifications_as_read',
        {
          user_id_param: user.id,
          notification_ids: null
        }
      );
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        is_read: true
      })));
      
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };
  
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // Call the RPC function to delete notification
      const { error } = await supabase.rpc(
        'delete_notifications',
        {
          user_id_param: user.id,
          notification_ids: [notificationId]
        }
      );
      
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.is_read).length);
      
      toast({
        title: "Success",
        description: "Notification deleted",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };
  
  const deleteAllNotifications = async () => {
    if (!user) return;
    
    try {
      // Call the RPC function to delete all notifications
      const { error } = await supabase.rpc(
        'delete_notifications',
        {
          user_id_param: user.id,
          notification_ids: null
        }
      );
      
      if (error) throw error;
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: "All notifications deleted",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      });
    }
  };
  
  const viewAllNotifications = () => {
    setIsOpen(false);
    navigate('/notifications');
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        
        {unreadCount > 0 && (
          <div className="px-2 py-1 flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={deleteAllNotifications}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete all
            </Button>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="flex justify-center mb-2">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-2">
              {notifications.slice(0, 5).map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
              
              {notifications.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={viewAllNotifications}
                >
                  View all notifications
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
