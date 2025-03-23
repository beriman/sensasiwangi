import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, MessageSquare, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { useEffect, useState } from "react";

interface UserProfileData {
  username: string;
  avatar_url: string;
  membership: "free" | "business";
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
}

const defaultBadges = [
  {
    id: "1",
    name: "Newbie",
    icon: "🌱",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "2",
    name: "Thread Starter",
    icon: "📝",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "3",
    name: "Helpful",
    icon: "👍",
    color: "bg-purple-100 text-purple-800",
  },
];

export default function UserProfileCard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData>({
    username: "User",
    avatar_url: "",
    membership: "free",
    badges: defaultBadges,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        // Get user profile data
        const { data: userData, error } = await supabase
          .from("users")
          .select("username, avatar_url, membership")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // For now, we'll use default badges
        // In a real app, you would fetch badges from a badges table
        setProfileData({
          username: userData?.username || user.email?.split("@")[0] || "User",
          avatar_url: userData?.avatar_url || "",
          membership: userData?.membership || "free",
          badges: defaultBadges,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Profile Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 border-4 border-white shadow-md">
            <AvatarImage
              src={profileData.avatar_url}
              alt={profileData.username}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-semibold">
              {getInitials(profileData.username)}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-3 text-lg font-semibold text-gray-900">
            {profileData.username}
          </h3>

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

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {profileData.badges.map((badge) => (
              <Badge key={badge.id} className={badge.color}>
                <span className="mr-1">{badge.icon}</span>
                {badge.name}
              </Badge>
            ))}
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

            <Link to="/marketplace">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
              >
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-medium">Market</span>
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
        </div>
      </CardContent>
    </Card>
  );
}
