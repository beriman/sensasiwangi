import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Crown,
  MessageSquare,
  ShoppingBag,
  User,
  Zap,
  Award,
  Mail,
  Tag,
  Edit,
  Pin,
  Camera,
  ImageIcon,
  Pencil,
  FileText,
  ThumbsUp,
  BarChart2,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { useEffect, useState, useRef } from "react";
import { getUserBadges } from "@/lib/forum";
import { ForumBadge } from "@/types/forum";
import { Progress } from "@/components/ui/progress";
import { calculateLevelProgress } from "@/lib/reputation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SocialStats from "@/components/profile/SocialStats";
import MessageButton from "@/components/messages/MessageButton";
import FollowButton from "@/components/profile/FollowButton";

interface UserProfileData {
  username: string;
  full_name?: string;
  avatar_url: string;
  cover_photo_url?: string;
  bio?: string;
  custom_title?: string;
  has_custom_title?: boolean;
  membership: "free" | "business";
  badges: ForumBadge[];
  exp: number;
  level: number;
  thread_count: number;
  reply_count: number;
  vote_count: {
    received: number;
    given: number;
  };
  leaderboard_position?: number;
}

// Reputation level calculation is now handled by the reputation.ts module

export default function UserProfileCard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData>({
    username: "User",
    avatar_url: "",
    membership: "free",
    badges: [],
    exp: 0,
    level: 0,
    thread_count: 0,
    reply_count: 0,
    vote_count: {
      received: 0,
      given: 0,
    },
    leaderboard_position: undefined,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        // Get user profile data
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            "username, full_name, avatar_url, cover_photo_url, bio, custom_title, has_custom_title, membership, exp",
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Fetch user badges
        const badges = await getUserBadges(user.id);

        // Get user level info based on exp
        const exp = userData?.exp || 0;
        const { currentLevel } = calculateLevelProgress(exp);

        // Get thread count
        const { count: threadCount, error: threadError } = await supabase
          .from("forum_threads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (threadError) throw threadError;

        // Get reply count
        const { count: replyCount, error: replyError } = await supabase
          .from("forum_replies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (replyError) throw replyError;

        // Get votes received
        const { count: votesReceived, error: votesReceivedError } =
          await supabase
            .from("forum_votes")
            .select("*", { count: "exact", head: true })
            .or(
              `thread_id.in.(select id from forum_threads where user_id.eq.${user.id}),reply_id.in.(select id from forum_replies where user_id.eq.${user.id})`,
            );

        if (votesReceivedError) throw votesReceivedError;

        // Get votes given
        const { count: votesGiven, error: votesGivenError } = await supabase
          .from("forum_votes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (votesGivenError) throw votesGivenError;

        // Get user's leaderboard position
        const { data: leaderboardData, error: leaderboardError } =
          await supabase
            .from("users")
            .select("id")
            .order("exp_points", { ascending: false });

        let leaderboardPosition = undefined;
        if (!leaderboardError && leaderboardData) {
          const userIndex = leaderboardData.findIndex(
            (item) => item.id === user.id,
          );
          if (userIndex !== -1) {
            leaderboardPosition = userIndex + 1; // +1 because array is 0-indexed
          }
        }

        setProfileData({
          username: userData?.username || user.email?.split("@")[0] || "User",
          full_name: userData?.full_name,
          avatar_url: userData?.avatar_url || "",
          cover_photo_url: userData?.cover_photo_url,
          bio: userData?.bio,
          custom_title: userData?.custom_title,
          has_custom_title: userData?.has_custom_title,
          membership: userData?.membership || "free",
          badges: badges,
          exp: exp,
          level: currentLevel.level,
          thread_count: threadCount || 0,
          reply_count: replyCount || 0,
          vote_count: {
            received: votesReceived || 0,
            given: votesGiven || 0,
          },
          leaderboard_position: leaderboardPosition,
        });

        setBioText(userData?.bio || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    try {
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile_images")
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfileData((prev) => ({
        ...prev,
        avatar_url: urlData.publicUrl,
      }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverPhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    try {
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile_images")
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ cover_photo_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfileData((prev) => ({
        ...prev,
        cover_photo_url: urlData.publicUrl,
      }));
    } catch (error) {
      console.error("Error uploading cover photo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveBio = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ bio: bioText })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setProfileData((prev) => ({
        ...prev,
        bio: bioText,
      }));
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get reputation level info
  const {
    progress: progressPercentage,
    nextLevel,
    expToNextLevel,
    currentLevel,
  } = calculateLevelProgress(profileData.exp);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Cover Photo Section */}
      <div className="relative w-full h-32 bg-gradient-to-r from-purple-100 to-blue-100 overflow-hidden">
        {profileData.cover_photo_url ? (
          <img
            src={profileData.cover_photo_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-100 to-blue-100">
            <span className="text-gray-400">Cover Photo</span>
          </div>
        )}

        {user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full h-8 w-8"
                  onClick={() => coverPhotoInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change cover photo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <input
          type="file"
          ref={coverPhotoInputRef}
          onChange={handleCoverPhotoUpload}
          className="hidden"
          accept="image/*"
        />
      </div>

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-medium text-gray-900">
          Profile Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative -mt-16 mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage
                src={profileData.avatar_url}
                alt={profileData.username}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-semibold">
                {getInitials(profileData.username)}
              </AvatarFallback>
            </Avatar>

            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute bottom-0 right-0 bg-white/80 hover:bg-white text-gray-700 rounded-full h-7 w-7"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change avatar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-900">
            {profileData.username}
          </h3>

          {profileData.full_name && (
            <p className="text-sm text-gray-500 mt-0.5">
              {profileData.full_name}
            </p>
          )}

          {profileData.has_custom_title && profileData.custom_title && (
            <Badge className="mt-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0">
              {profileData.custom_title}
            </Badge>
          )}

          {/* Bio Section */}
          <div className="w-full mt-3 mb-3">
            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
                  rows={3}
                  placeholder="Write something about yourself..."
                  maxLength={200}
                />
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {bioText.length}/200
                  </span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        setBioText(profileData.bio || "");
                        setIsEditingBio(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-7 px-2 bg-purple-600 hover:bg-purple-700"
                      onClick={saveBio}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                {profileData.bio ? (
                  <p>{profileData.bio}</p>
                ) : (
                  <p className="text-gray-400 italic">No bio provided</p>
                )}
                {user && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-gray-600"
                    onClick={() => setIsEditingBio(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Level and XP Display */}
          <div className="mt-1 flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
              <Zap className="h-3 w-3 mr-1" />
              Level {profileData.level}: {currentLevel.title}
            </Badge>
            <span className="text-xs text-gray-500">{profileData.exp} XP</span>
            {profileData.leaderboard_position && (
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0">
                <Trophy className="h-3 w-3 mr-1" />
                Rank #{profileData.leaderboard_position}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {currentLevel.description}
          </p>

          {/* XP Progress Bar */}
          <div className="w-full mt-2 mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>
                {nextLevel ? `Progress to ${nextLevel.title}` : "Max Level"}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {nextLevel && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {expToNextLevel} XP needed
              </div>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <Badge
              className={
                profileData.membership === "business"
                  ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0"
                  : "bg-gray-100 text-gray-800"
              }
            >
              <Crown className="h-3 w-3 mr-1" />
              {profileData.membership === "business" ? "Business" : "Free"}{" "}
              Membership
            </Badge>

            {profileData.membership === "free" && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                Upgrade
              </Button>
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-500 mb-2 text-center">
              Badges & Achievements
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {profileData.badges.length > 0 ? (
                profileData.badges.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={badge.color}>
                          <span className="mr-1">{badge.icon}</span>
                          {badge.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No badges earned yet
                </p>
              )}
            </div>
          </div>

          {/* Social Stats Section */}
          <div className="mt-4 w-full">
            <SocialStats userId={user?.id || ""} />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 w-full">
            <Link to="/forum">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
              >
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <span className="text-xs font-medium">Forum</span>
              </Button>
            </Link>

            <Link to="/messages">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
              >
                <Mail className="h-5 w-5 text-purple-500" />
                <span className="text-xs font-medium">Messages</span>
              </Button>
            </Link>

            <Link to="/profile">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-green-200 hover:bg-green-50"
              >
                <User className="h-5 w-5 text-green-500" />
                <span className="text-xs font-medium">Profile</span>
              </Button>
            </Link>
          </div>

          {/* User Statistics Section */}
          <div className="mt-4 w-full">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              User Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                    <span className="text-sm font-medium">Posts</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {profileData.thread_count + profileData.reply_count}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Threads: {profileData.thread_count}</span>
                  <span>Replies: {profileData.reply_count}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium">Votes</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {profileData.vote_count.received +
                      profileData.vote_count.given}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Received: {profileData.vote_count.received}</span>
                  <span>Given: {profileData.vote_count.given}</span>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Available Features
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-gray-600">
                <Tag className="h-3 w-3 mr-1 text-purple-500" />
                <span>Thread Categories & Tags</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Edit className="h-3 w-3 mr-1 text-purple-500" />
                <span>Rich Text Editor</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Pin className="h-3 w-3 mr-1 text-purple-500" />
                <span>Thread Pinning</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-3 w-3 mr-1 text-purple-500" />
                <span>Private Messaging</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
