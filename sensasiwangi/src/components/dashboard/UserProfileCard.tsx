// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
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
  Star,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { calculateLevelProgress } from "../../lib/reputation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface UserProfileData {
  username: string;
  full_name?: string;
  avatar_url: string;
  cover_photo_url?: string;
  bio?: string;
  custom_title?: string;
  has_custom_title?: boolean;
  membership: "free" | "business";
  exp: number;
  level: number;
  thread_count: number;
  reply_count: number;
  vote_count: {
    received: number;
    given: number;
  };
  leaderboard_position?: number;
  // Marketplace data
  seller_info?: {
    total_products: number;
    active_products: number;
    avg_rating: number;
    review_count: number;
    total_sales: number;
  };
  buyer_info?: {
    total_purchases: number;
    pending_orders: number;
    completed_orders: number;
    sambatan_participations: number;
  };
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function UserProfileCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData>({
    username: "User",
    avatar_url: "",
    membership: "free",
    exp: 0,
    level: 0,
    thread_count: 0,
    reply_count: 0,
    vote_count: {
      received: 0,
      given: 0,
    },
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
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
        const { count: votesReceived, error: votesReceivedError } = await supabase
          .from("forum_votes")
          .select("*", { count: "exact", head: true })
          .eq("target_user_id", user.id);

        if (votesReceivedError) throw votesReceivedError;

        // Get votes given
        const { count: votesGiven, error: votesGivenError } = await supabase
          .from("forum_votes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (votesGivenError) throw votesGivenError;

        // Get marketplace seller info
        const { data: products, error: productsError } = await supabase
          .from("marketplace_products")
          .select("id, price, status, avg_rating, review_count, total_sales")
          .eq("seller_id", user.id);

        if (productsError) throw productsError;

        let sellerInfo = undefined;
        if (products && products.length > 0) {
          const activeProducts = products.filter(p => p.status === 'active').length;
          const avgRating = products.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / products.length;
          const reviewCount = products.reduce((sum, p) => sum + (p.review_count || 0), 0);
          const totalSales = products.reduce((sum, p) => sum + (p.total_sales || 0), 0);

          sellerInfo = {
            total_products: products.length,
            active_products: activeProducts,
            avg_rating: avgRating,
            review_count: reviewCount,
            total_sales: totalSales
          };
        }

        // Get marketplace buyer info
        const { data: orders, error: ordersError } = await supabase
          .from("marketplace_orders")
          .select("id, status")
          .eq("buyer_id", user.id);

        if (ordersError) throw ordersError;

        let buyerInfo = undefined;
        if (orders && orders.length > 0) {
          const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
          const completedOrders = orders.filter(o => o.status === 'completed').length;

          // Get sambatan participations
          const { count: sambatanCount, error: sambatanError } = await supabase
            .from("sambatan_participants")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          if (sambatanError) throw sambatanError;

          buyerInfo = {
            total_purchases: orders.length,
            pending_orders: pendingOrders,
            completed_orders: completedOrders,
            sambatan_participations: sambatanCount || 0
          };
        }

        // Get leaderboard position
        let leaderboardPosition = undefined;
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from("users")
          .select("id")
          .order("exp", { ascending: false })
          .limit(100);

        if (!leaderboardError && leaderboardData) {
          const position = leaderboardData.findIndex(u => u.id === user.id);
          if (position !== -1) {
            leaderboardPosition = position + 1;
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
          exp: exp,
          level: currentLevel.level,
          thread_count: threadCount || 0,
          reply_count: replyCount || 0,
          vote_count: {
            received: votesReceived || 0,
            given: votesGiven || 0,
          },
          leaderboard_position: leaderboardPosition,
          seller_info: sellerInfo,
          buyer_info: buyerInfo,
        });

        setBioText(userData?.bio || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || !event.target.files[0]) return;

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
      setProfileData({
        ...profileData,
        avatar_url: urlData.publicUrl,
      });

      toast({
        title: "Avatar updated",
        description: "Your profile avatar has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || !event.target.files[0]) return;

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
      setProfileData({
        ...profileData,
        cover_photo_url: urlData.publicUrl,
      });

      toast({
        title: "Cover photo updated",
        description: "Your profile cover photo has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload cover photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBioUpdate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ bio: bioText })
        .eq("id", user.id);

      if (error) throw error;

      setProfileData({
        ...profileData,
        bio: bioText,
      });
      setIsEditingBio(false);

      toast({
        title: "Bio updated",
        description: "Your profile bio has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating bio:", error);
      toast({
        title: "Update failed",
        description: "Failed to update bio. Please try again.",
        variant: "destructive",
      });
    }
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
                src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
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

          {/* Membership Badge */}
          <div className="mt-2">
            {profileData.membership === "business" ? (
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Business Membership
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800">
                  <User className="h-3 w-3 mr-1" />
                  Free Membership
                </Badge>
                <Link to="/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Level and XP Display */}
          <div className="mt-3 w-full">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1 text-purple-500" />
                Level {profileData.level}
              </span>
              <span className="text-gray-500 text-xs">
                {profileData.exp} / {nextLevel.expRequired} XP
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{currentLevel.title}</span>
              <span>{nextLevel.title}</span>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-4 w-full">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">About Me</h4>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsEditingBio(!isEditingBio)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Write something about yourself..."
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioText(profileData.bio || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleBioUpdate}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {profileData.bio || (
                  <span className="text-gray-400 italic">
                    No bio provided. Click the edit button to add one.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* User Statistics Section */}
          <div className="mt-4 w-full">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              User Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3">
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
                    {profileData.vote_count.received}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Received: {profileData.vote_count.received}</span>
                  <span>Given: {profileData.vote_count.given}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 w-full">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Quick Actions
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <Link to="/profile">
                <Button
                  variant="outline"
                  className="w-full h-10 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                >
                  <User className="h-4 w-4 text-purple-500" />
                  <span className="text-xs">Profile</span>
                </Button>
              </Link>
              <Link to="/messages">
                <Button
                  variant="outline"
                  className="w-full h-10 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                >
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-xs">Messages</span>
                </Button>
              </Link>
              <Link to="/marketplace/my-shop">
                <Button
                  variant="outline"
                  className="w-full h-10 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-amber-200 hover:bg-amber-50"
                >
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                  <span className="text-xs">My Shop</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


