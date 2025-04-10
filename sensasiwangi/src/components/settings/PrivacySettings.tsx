import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Eye, EyeOff, Users } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/privacy";
import { PrivacySettings as PrivacySettingsType } from "@/types/privacy";
import BlockedUsersList from "@/components/profile/BlockedUsersList";

export default function PrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsType>({
    profile_visibility: "public",
    show_marketplace_activity: true,
    show_forum_activity: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getPrivacySettings(user.id);
        setSettings(data);
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
        toast({
          title: "Error",
          description: "Failed to load privacy settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await updatePrivacySettings(user.id, settings);
      toast({
        title: "Settings Saved",
        description: "Your privacy settings have been updated",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-purple-600" />
            Profile Privacy
          </CardTitle>
          <CardDescription>
            Control who can see your profile and interact with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Profile Visibility</Label>
            <RadioGroup
              value={settings.profile_visibility}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  profile_visibility: value as
                    | "public"
                    | "followers_only"
                    | "private",
                })
              }
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:border-purple-100 hover:bg-purple-50">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="public" className="flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-green-500" />
                    Public
                  </Label>
                  <p className="text-sm text-gray-500">
                    Anyone can view your profile, posts, and activity
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:border-purple-100 hover:bg-purple-50">
                <RadioGroupItem
                  value="followers_only"
                  id="followers_only"
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="followers_only" className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    Followers Only
                  </Label>
                  <p className="text-sm text-gray-500">
                    Only users who follow you can see your full profile and
                    activity
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:border-purple-100 hover:bg-purple-50">
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="private" className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-2 text-red-500" />
                    Private
                  </Label>
                  <p className="text-sm text-gray-500">
                    Your profile is hidden from everyone except yourself
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-medium">Activity Visibility</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_marketplace_activity">
                    Marketplace Activity
                  </Label>
                  <p className="text-sm text-gray-500">
                    Show your marketplace listings and purchases on your profile
                  </p>
                </div>
                <Switch
                  id="show_marketplace_activity"
                  checked={settings.show_marketplace_activity}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      show_marketplace_activity: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_forum_activity">Forum Activity</Label>
                  <p className="text-sm text-gray-500">
                    Show your forum posts and replies on your profile
                  </p>
                </div>
                <Switch
                  id="show_forum_activity"
                  checked={settings.show_forum_activity}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      show_forum_activity: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Privacy Settings
          </Button>
        </CardContent>
      </Card>

      <BlockedUsersList />
    </div>
  );
}
