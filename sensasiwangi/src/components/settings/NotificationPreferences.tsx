// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import { Switch } from "../../components/ui/switch";
// @ts-ignore
import { Button } from "../../components/ui/button";
import {
  Loader2,
  Bell,
  MessageSquare,
  UserPlus,
  ShoppingBag,
} from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../lib/privacy";
// @ts-ignore
import { NotificationPreferences as NotificationPreferencesType } from "../../types/privacy";

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    notify_forum_replies: true,
    notify_new_followers: true,
    notify_marketplace_orders: true,
    email_forum_replies: false,
    email_new_followers: false,
    email_marketplace_orders: false,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getNotificationPreferences(user.id);
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

    fetchPreferences();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await updateNotificationPreferences(user.id, preferences);
      toast({
        title: "Preferences Saved",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-purple-600" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control what notifications you receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">In-App Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="notify_forum_replies"
                    className="flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                    Forum Replies
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications when someone replies to your forum
                    posts
                  </p>
                </div>
                <Switch
                  id="notify_forum_replies"
                  checked={preferences.notify_forum_replies}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      notify_forum_replies: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="notify_new_followers"
                    className="flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                    New Followers
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications when someone follows you
                  </p>
                </div>
                <Switch
                  id="notify_new_followers"
                  checked={preferences.notify_new_followers}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      notify_new_followers: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="notify_marketplace_orders"
                    className="flex items-center"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2 text-amber-500" />
                    Marketplace Orders
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about your marketplace orders and
                    sales
                  </p>
                </div>
                <Switch
                  id="notify_marketplace_orders"
                  checked={preferences.notify_marketplace_orders}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      notify_marketplace_orders: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="email_forum_replies"
                    className="flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                    Forum Replies
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications when someone replies to your
                    forum posts
                  </p>
                </div>
                <Switch
                  id="email_forum_replies"
                  checked={preferences.email_forum_replies}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      email_forum_replies: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="email_new_followers"
                    className="flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                    New Followers
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications when someone follows you
                  </p>
                </div>
                <Switch
                  id="email_new_followers"
                  checked={preferences.email_new_followers}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      email_new_followers: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="email_marketplace_orders"
                    className="flex items-center"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2 text-amber-500" />
                    Marketplace Orders
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications about your marketplace orders
                    and sales
                  </p>
                </div>
                <Switch
                  id="email_marketplace_orders"
                  checked={preferences.email_marketplace_orders}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      email_marketplace_orders: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notification Preferences
        </Button>
      </CardContent>
    </Card>
  );
}


