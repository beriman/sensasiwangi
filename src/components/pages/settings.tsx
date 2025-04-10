import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import MainLayout from "../layout/MainLayout";

interface UserProfile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  membership: "free" | "business";
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
    membership: "free",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Get user profile data
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          membership: data.membership || "free",
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      // Upload avatar if there's a new one
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      // Update profile in database
      const { error } = await supabase
        .from("users")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Loading settings..." />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pb-6">
            <TabsContent value="profile" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage
                          src={
                            avatarPreview ||
                            profile.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                          }
                          alt="Profile"
                        />
                        <AvatarFallback>
                          {profile.full_name?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center">
                        <Label
                          htmlFor="avatar"
                          className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Change Avatar
                        </Label>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) =>
                          setProfile({ ...profile, username: e.target.value })
                        }
                        placeholder="Your username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="account" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="flex">
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="bg-gray-50"
                        />
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() =>
                            toast({
                              title: "Coming Soon",
                              description:
                                "Email change functionality will be available soon.",
                            })
                          }
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex">
                        <Input
                          type="password"
                          value="********"
                          disabled
                          className="bg-gray-50"
                        />
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() =>
                            toast({
                              title: "Coming Soon",
                              description:
                                "Password change functionality will be available soon.",
                            })
                          }
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Membership</h3>
                  <Card className="bg-gray-50 border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {profile.membership === "business" 
                              ? "Business Plan" 
                              : "Free Plan"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {profile.membership === "business"
                              ? "Full access to all features including dashboard"
                              : "Basic access to community features"}
                          </p>
                        </div>
                        {profile.membership === "free" && (
                          <Button
                            onClick={() =>
                              toast({
                                title: "Coming Soon",
                                description:
                                  "Membership upgrade options will be available soon.",
                              })
                            }
                          >
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-red-600">
                    Danger Zone
                  </h3>
                  <Card className="border border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Delete Account</p>
                          <p className="text-sm text-gray-500">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            toast({
                              title: "Coming Soon",
                              description:
                                "Account deletion functionality will be available soon.",
                            })
                          }
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Notification settings coming soon!
                  </p>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
