import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  CheckCircle,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import NotificationItem from "../notifications/NotificationItem";
import MainLayout from "@/components/layouts/MainLayout";

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

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
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
        .order('created_at', { ascending: false });
      
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
  
  const getFilteredNotifications = () => {
    let filtered = [...notifications];
    
    // Filter by read status
    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === "read") {
      filtered = filtered.filter(n => n.is_read);
    }
    
    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    return filtered;
  };
  
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <MainLayout>
      <div className="container max-w-4xl py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500">
              Stay updated with your latest activities
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            {unreadCount > 0 && (
              <Badge variant="outline" className="mr-4">
                {unreadCount} unread
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={deleteAllNotifications}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete all
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Notification Type</h3>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="badge">Badges</SelectItem>
                      <SelectItem value="achievement">Achievements</SelectItem>
                      <SelectItem value="challenge">Challenges</SelectItem>
                      <SelectItem value="leaderboard">Leaderboard</SelectItem>
                      <SelectItem value="level_up">Level Up</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as "all" | "unread" | "read")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center">
              <Bell className="h-4 w-4 mr-1" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center">
              <Badge variant="outline" className="mr-1">
                {unreadCount}
              </Badge>
              Unread
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Read
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Bell className="h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-gray-500">
                    You don't have any notifications yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No unread notifications</h3>
                  <p className="text-gray-500">
                    You've read all your notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="read">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Bell className="h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No read notifications</h3>
                  <p className="text-gray-500">
                    You don't have any read notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
