import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import {
  Bell,
  Mail,
  MessageSquare,
  AtSign,
  RefreshCw,
  ThumbsUp,
  Megaphone,
  Settings,
  Save,
  Loader2
} from "lucide-react";

interface NotificationPreferences {
  new_replies: boolean;
  mentions: boolean;
  thread_updates: boolean;
  votes: boolean;
  thread_subscriptions: boolean;
  direct_messages: boolean;
  system_announcements: boolean;
  marketing_emails: boolean;
  email_digest_frequency: string;
  push_notifications: boolean;
  email_notifications: boolean;
}

function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_replies: true,
    mentions: true,
    thread_updates: true,
    votes: true,
    thread_subscriptions: true,
    direct_messages: true,
    system_announcements: true,
    marketing_emails: false,
    email_digest_frequency: 'daily',
    push_notifications: true,
    email_notifications: true
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("notification-types");

  useEffect(() => {
    if (user) {
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'get_notification_preferences',
        { user_id_param: user.id }
      );

      if (error) throw error;

      setPreferences(data);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase.rpc(
        'update_notification_preferences',
        {
          user_id_param: user.id,
          new_replies_param: preferences.new_replies,
          mentions_param: preferences.mentions,
          thread_updates_param: preferences.thread_updates,
          votes_param: preferences.votes,
          thread_subscriptions_param: preferences.thread_subscriptions,
          direct_messages_param: preferences.direct_messages,
          system_announcements_param: preferences.system_announcements,
          marketing_emails_param: preferences.marketing_emails,
          email_digest_frequency_param: preferences.email_digest_frequency,
          push_notifications_param: preferences.push_notifications,
          email_notifications_param: preferences.email_notifications
        }
      );

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  const handleDigestFrequencyChange = (value: string) => {
    setPreferences({
      ...preferences,
      email_digest_frequency: value
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Customize how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading preferences..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Customize how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notification-types" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="notification-types" className="flex items-center">
              <Bell className="h-4 w-4 mr-1" />
              Notification Types
            </TabsTrigger>
            <TabsTrigger value="delivery-methods" className="flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Delivery Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notification-types" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="new-replies" className="font-medium">New Replies</Label>
                </div>
                <Switch
                  id="new-replies"
                  checked={preferences.new_replies}
                  onCheckedChange={() => handleToggle('new_replies')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications when someone replies to your threads
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AtSign className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="mentions" className="font-medium">Mentions</Label>
                </div>
                <Switch
                  id="mentions"
                  checked={preferences.mentions}
                  onCheckedChange={() => handleToggle('mentions')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications when someone mentions you in a post
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <Label htmlFor="thread-updates" className="font-medium">Thread Updates</Label>
                </div>
                <Switch
                  id="thread-updates"
                  checked={preferences.thread_updates}
                  onCheckedChange={() => handleToggle('thread_updates')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications when threads you are subscribed to are updated
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="votes" className="font-medium">Votes</Label>
                </div>
                <Switch
                  id="votes"
                  checked={preferences.votes}
                  onCheckedChange={() => handleToggle('votes')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications when someone votes on your posts
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  <Label htmlFor="thread-subscriptions" className="font-medium">Thread Subscriptions</Label>
                </div>
                <Switch
                  id="thread-subscriptions"
                  checked={preferences.thread_subscriptions}
                  onCheckedChange={() => handleToggle('thread_subscriptions')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications when someone subscribes to your threads
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-pink-500" />
                  <Label htmlFor="direct-messages" className="font-medium">Direct Messages</Label>
                </div>
                <Switch
                  id="direct-messages"
                  checked={preferences.direct_messages}
                  onCheckedChange={() => handleToggle('direct_messages')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications for direct messages
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Megaphone className="h-4 w-4 text-red-500" />
                  <Label htmlFor="system-announcements" className="font-medium">System Announcements</Label>
                </div>
                <Switch
                  id="system-announcements"
                  checked={preferences.system_announcements}
                  onCheckedChange={() => handleToggle('system_announcements')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications for important system announcements
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={preferences.marketing_emails}
                  onCheckedChange={() => handleToggle('marketing_emails')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive marketing emails and newsletters
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delivery-methods" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.push_notifications}
                  onCheckedChange={() => handleToggle('push_notifications')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive push notifications in your browser
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={() => handleToggle('email_notifications')}
                />
              </div>
              <div className="text-sm text-gray-500 ml-6">
                Receive notifications via email
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email-digest-frequency" className="font-medium">Email Digest Frequency</Label>
                <RadioGroup
                  id="email-digest-frequency"
                  value={preferences.email_digest_frequency}
                  onValueChange={handleDigestFrequencyChange}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never">Never</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                </RadioGroup>
                <div className="text-sm text-gray-500 ml-6">
                  How often you want to receive email digests of your notifications
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSavePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { NotificationPreferences };
export default NotificationPreferences;
