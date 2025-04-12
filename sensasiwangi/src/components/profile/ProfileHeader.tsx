// @ts-ignore
import React from "react";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Card, CardContent } from "../../components/ui/card";
// @ts-ignore
import SocialStats from "./SocialStats";
// @ts-ignore
import { Crown, Star, ShieldCheck } from "lucide-react";

interface ProfileHeaderProps {
  userId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  customTitle?: string;
  hasCustomTitle?: boolean;
  membership?: "free" | "business";
  level?: number;
  levelTitle?: string;
  isApproved?: boolean;
}

export default function ProfileHeader({
  userId,
  username,
  fullName,
  avatarUrl,
  coverPhotoUrl,
  bio,
  customTitle,
  hasCustomTitle,
  membership = "free",
  level = 1,
  levelTitle = "Newbie",
  isApproved = false,
}: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Cover Photo */}
      <div className="relative w-full h-48 bg-gradient-to-r from-purple-100 to-blue-100 overflow-hidden">
        {coverPhotoUrl ? (
          <img
            src={coverPhotoUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-100 to-blue-100">
            <span className="text-gray-400">Cover Photo</span>
          </div>
        )}
      </div>

      <CardContent className="pt-0">
        <div className="flex flex-col items-center -mt-16 mb-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-md">
              <AvatarImage
                src={
                  avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
                }
                alt={username}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl font-semibold">
                {getInitials(username)}
              </AvatarFallback>
            </Avatar>
            {membership === "business" && (
              <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1.5 shadow-md border-2 border-white">
                <Star className="h-5 w-5 text-white" fill="white" />
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {username}
              {isApproved && (
                <ShieldCheck
                  className="h-5 w-5 text-blue-500"
                  title="Verified Profile"
                />
              )}
            </h2>
            {fullName && <p className="text-gray-600">{fullName}</p>}

            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                Level {level}: {levelTitle}
              </Badge>

              {hasCustomTitle && customTitle && (
                <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0">
                  {customTitle}
                </Badge>
              )}

              <Badge
                className={
                  membership === "business"
                    ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0"
                    : "bg-gray-100 text-gray-800"
                }
              >
                <Crown className="h-3 w-3 mr-1" />
                {membership === "business" ? "Business" : "Free"}
              </Badge>

              {isApproved && (
                <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {bio && (
            <div className="mt-4 text-center max-w-2xl">
              <p className="text-gray-600">{bio}</p>
            </div>
          )}

          <div className="w-full mt-6">
            <SocialStats userId={userId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


