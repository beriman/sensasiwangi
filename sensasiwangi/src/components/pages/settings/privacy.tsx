// @ts-ignore
import React from "react";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
// @ts-ignore
import PrivacySettings from "../../../components/settings/PrivacySettings";
// @ts-ignore
import NotificationPreferences from "../../../components/settings/NotificationPreferences";
// @ts-ignore
import { ShieldAlert, Bell } from "lucide-react";
// @ts-ignore
import { Button } from "../../../components/ui/button";
// @ts-ignore
import { ArrowLeft } from "lucide-react";
// @ts-ignore
import { useNavigate } from "react-router-dom";

export default function PrivacySettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-2xl font-bold mb-6">Privacy & Notifications</h1>

      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Privacy Settings
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> Notification Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}


