import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import {
  Crown,
  Settings,
  MessageSquare,
  ShoppingBag,
  Mail,
  User,
} from "lucide-react";
import MainLayout from "../layout/MainLayout";
import UserProfileCard from "../dashboard/UserProfileCard";
import BookmarkedThreads from "../profile/BookmarkedThreads";
import BadgeCollection from "../profile/BadgeCollection";
import AchievementCollection from "../profile/AchievementCollection";
import LeaderboardHistory from "../profile/LeaderboardHistory";
import ProfileCustomization from "../profile/ProfileCustomization";
import ProfileShowcase from "../profile/ProfileShowcase";
import ExpCard from "../profile/ExpCard";
import FollowSection from "../profile/FollowSection";
import SocialStats from "../profile/SocialStats";
import ProfileAboutMe from "../profile/ProfileAboutMe";
import ProfileRadarChart from "../profile/ProfileRadarChart";
import ProfileTimeline from "../profile/ProfileTimeline";
import ProfileMetrics from "../profile/ProfileMetrics";
import ProfileEndorsements from "../profile/ProfileEndorsements";
import MessageButton from "../messages/MessageButton";

interface UserProfile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  membership: "free" | "business";
  exp_points: number;
  level: number;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if current user is viewing their own profile
    setIsCurrentUser(true);

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

        setProfile(data as UserProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (loading) {
    return <LoadingScreen text="Loading profile..." />;
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
          <p className="mb-4">Please log in to view your profile.</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          <UserProfileCard />

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-gray-900">
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Member Since
                  </p>
                  <p className="text-sm">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : new Date(user.created_at || "").toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Membership
                  </p>
                  <div className="flex items-center mt-1">
                    <Badge
                      className={
                        profile?.membership === "business"
                          ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {profile?.membership === "business"
                        ? "Business"
                        : "Free"}{" "}
                      Membership
                    </Badge>
                  </div>
                </div>
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Social Stats Card */}
          <SocialStats userId={user.id} />
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <Tabs
                defaultValue="overview"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="showcase">Showcase</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ProfileAboutMe userId={user.id} isCurrentUser={isCurrentUser} />
                      <ProfileMetrics userId={user.id} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ProfileRadarChart userId={user.id} />
                      <ProfileTimeline userId={user.id} limit={5} />
                    </div>

                    <ExpCard userId={user.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ProfileEndorsements userId={user.id} />
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Recent Achievements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <AchievementCollection userId={user.id} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-medium">Showcase</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProfileShowcase userId={user.id} isCurrentUser={isCurrentUser} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-medium">Quick Links</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                        <Link to="/forum">
                          <Button
                            variant="outline"
                            className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                          >
                            <MessageSquare className="h-5 w-5 text-purple-500" />
                            <span className="text-xs font-medium">Forum</span>
                          </Button>
                        </Link>

                        <Link to="/marketplace">
                          <Button
                            variant="outline"
                            className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                          >
                            <ShoppingBag className="h-5 w-5 text-blue-500" />
                            <span className="text-xs font-medium">
                              Marketplace
                            </span>
                          </Button>
                        </Link>

                        <Link to="/messages">
                          <Button
                            variant="outline"
                            className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-green-200 hover:bg-green-50"
                          >
                            <Mail className="h-5 w-5 text-green-500" />
                            <span className="text-xs font-medium">
                              Messages
                            </span>
                          </Button>
                        </Link>
                      </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="achievements" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Badges</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <BadgeCollection userId={user.id} />
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Achievements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <AchievementCollection userId={user.id} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-medium">Leaderboard Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LeaderboardHistory userId={user.id} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProfileTimeline userId={user.id} limit={10} />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Recent Threads</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-500 text-center py-4">Recent threads will be displayed here</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Recent Replies</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-500 text-center py-4">Recent replies will be displayed here</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="showcase" className="mt-6">
                  <ProfileShowcase userId={user.id} isCurrentUser={isCurrentUser} />
                </TabsContent>

                <TabsContent value="connections" className="mt-6">
                  <FollowSection userId={user.id} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <div className="space-y-6">
                    {isCurrentUser ? (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Profile Customization</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ProfileCustomization userId={user.id} isCurrentUser={isCurrentUser} />
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">Bookmarks</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <BookmarkedThreads />
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">Only the profile owner can access settings</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
