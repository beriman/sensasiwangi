import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../../supabase/supabase";
import { useAuth } from "../../../../supabase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UserBadges from "@/components/profile/UserBadges";
import FollowersList from "@/components/profile/FollowersList";
import FollowingList from "@/components/profile/FollowingList";
import UserActivityTabs from "@/components/profile/UserActivityTabs";
import { calculateLevelProgress } from "@/lib/reputation";
import { ForumBadge } from "@/types/forum";
import { getUserBadges, getAllBadges } from "@/lib/forum";
import UserNotes from "@/components/admin/UserNotes";
import ProfileApproval from "@/components/admin/ProfileApproval";

interface UserProfileData {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  bio?: string;
  custom_title?: string;
  has_custom_title?: boolean;
  membership: "free" | "business";
  exp_points: number;
  level: number;
  is_approved: boolean;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [userBadges, setUserBadges] = useState<ForumBadge[]>([]);
  const [allBadges, setAllBadges] = useState<ForumBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // If no userId is provided, use the current user's ID
        const targetUserId = userId || user?.id;

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        // Check if current user is admin
        if (user) {
          const { data: adminData } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .single();

          setIsAdmin(adminData?.is_admin || false);
        }

        // Get user profile data
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            "id, username, full_name, avatar_url, cover_photo_url, bio, custom_title, has_custom_title, membership, exp_points, level, is_approved",
          )
          .eq("id", targetUserId)
          .single();

        if (error) throw error;

        // Get user badges
        const badges = await getUserBadges(targetUserId);
        setUserBadges(badges);

        // Get all available badges
        const allAvailableBadges = await getAllBadges();
        setAllBadges(allAvailableBadges);

        // Calculate level info if needed
        let levelInfo = { title: "Newbie" };
        if (userData.exp_points) {
          const { currentLevel } = calculateLevelProgress(userData.exp_points);
          levelInfo = currentLevel;
        }

        setProfileData({
          ...userData,
          username: userData.username || userData.full_name || "User",
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-600 mt-2">
          The user you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  // Calculate level title
  const { currentLevel } = calculateLevelProgress(profileData.exp_points || 0);
  // Check if this is the user's own profile
  const isOwnProfile = user?.id === profileData.id;

  const handleApprovalStatusChange = (isApproved: boolean) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        is_approved: isApproved,
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileHeader
        userId={profileData.id}
        username={profileData.username}
        fullName={profileData.full_name}
        avatarUrl={profileData.avatar_url}
        coverPhotoUrl={profileData.cover_photo_url}
        bio={profileData.bio}
        customTitle={profileData.custom_title}
        hasCustomTitle={profileData.has_custom_title}
        membership={profileData.membership}
        level={profileData.level || 1}
        levelTitle={currentLevel.title}
        isApproved={profileData.is_approved}
      />

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserBadges
                userBadges={userBadges}
                allBadges={allBadges}
                showAll={true}
              />

              {/* Admin tools section */}
              {isAdmin && !isOwnProfile && (
                <div className="space-y-6">
                  <ProfileApproval
                    userId={profileData.id}
                    onStatusChange={handleApprovalStatusChange}
                  />
                  <UserNotes userId={profileData.id} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <UserActivityTabs
              userId={profileData.id}
              isOwnProfile={isOwnProfile}
            />
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Followers</h3>
                <FollowersList userId={profileData.id} limit={5} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Following</h3>
                <FollowingList userId={profileData.id} limit={5} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
