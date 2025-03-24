import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import {
  Crown,
  Settings,
  MessageSquare,
  ShoppingBag,
  Mail,
} from "lucide-react";
import UserProfileCard from "../dashboard/UserProfileCard";
import BookmarkedThreads from "../profile/BookmarkedThreads";
import { getUserBadges, getAllBadges } from "@/lib/forum";
import { ForumBadge } from "@/types/forum";
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

interface ProfileState extends UserProfile {
  badges: ForumBadge[];
  allBadges: ForumBadge[];
}

// Removed defaultBadges as we'll fetch them from the database

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) return;

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

        // Get user badges
        const userBadges = await getUserBadges(user.id);

        // Get all available badges
        const allAvailableBadges = await getAllBadges();

        setProfile({
          ...(data as UserProfile),
          badges: userBadges,
          allBadges: allAvailableBadges,
        });
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
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
        <p className="mb-4">Please log in to view your profile.</p>
        <Link to="/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1">
          <UserProfileCard />

          <Card className="mt-6 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                {user && profile && user.id !== profile.id && (
                  <MessageButton
                    userId={profile.id}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    showIcon={true}
                  />
                )}
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <Tabs
                defaultValue="overview"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">About Me</h3>
                      <p className="mt-2 text-gray-600">
                        {profile?.bio ||
                          "No bio provided. Edit your profile to add a bio."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Badges</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.badges.length > 0 ? (
                          profile.badges.map((badge) => (
                            <Badge key={badge.id} className={badge.color}>
                              <span className="mr-1">{badge.icon}</span>
                              {badge.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No badges earned yet. Participate in the forum to
                            earn badges!
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Available Badges</h3>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profile.allBadges
                          .filter(
                            (badge) =>
                              !profile.badges.some(
                                (userBadge) => userBadge.id === badge.id,
                              ),
                          )
                          .slice(0, 6) // Show only first 6 available badges
                          .map((badge) => (
                            <div
                              key={badge.id}
                              className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50"
                            >
                              <div
                                className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${badge.color.split(" ").slice(0, 2).join(" ")}`}
                              >
                                <span>{badge.icon}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {badge.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {badge.description}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                      {profile.allBadges.filter(
                        (badge) =>
                          !profile.badges.some(
                            (userBadge) => userBadge.id === badge.id,
                          ),
                      ).length > 6 && (
                        <p className="text-xs text-center mt-2 text-gray-500">
                          And{" "}
                          {profile.allBadges.filter(
                            (badge) =>
                              !profile.badges.some(
                                (userBadge) => userBadge.id === badge.id,
                              ),
                          ).length - 6}{" "}
                          more badges to unlock!
                        </p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Quick Links</h3>
                      <div className="mt-2 grid grid-cols-2 gap-3">
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
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Activity feed coming soon!
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-6">
                  <BookmarkedThreads />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
