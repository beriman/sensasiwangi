import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, MessageSquare, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { getFollowStats } from "@/lib/social";
import { FollowStats } from "@/types/social";
import { useAuth } from "../../../supabase/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import FollowButton from "./FollowButton";
import BlockButton from "./BlockButton";
import MessageButton from "../messages/MessageButton";
import { isUserBlocked } from "@/lib/privacy";

interface SocialStatsProps {
  userId: string;
  className?: string;
}

export default function SocialStats({
  userId,
  className = "",
}: SocialStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getFollowStats(userId, user?.id);
        setStats(data);

        // Check if user is blocked
        if (user && user.id !== userId) {
          const blocked = await isUserBlocked(user.id, userId);
          setIsBlocked(blocked);
        }
      } catch (error) {
        console.error("Error fetching social data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user]);

  const handleFollowChange = (isFollowing: boolean) => {
    if (stats) {
      setStats({
        ...stats,
        is_following: isFollowing,
        // If the current user follows this user, increment the followers count
        followers_count: isFollowing
          ? stats.followers_count + 1
          : Math.max(0, stats.followers_count - 1),
      });
    }
  };

  const handleBlockChange = (isBlocked: boolean) => {
    setIsBlocked(isBlocked);
    // If user is blocked, they are automatically unfollowed
    if (isBlocked && stats?.is_following) {
      handleFollowChange(false);
    }
  };

  if (loading) {
    return (
      <Card
        className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}
      >
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner text="Loading stats..." />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card
      className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-6">
            <Link
              to={`/profile/${userId}/followers`}
              className="flex flex-col items-center hover:text-purple-600 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="font-semibold">{stats.followers_count}</span>
              </div>
              <span className="text-xs text-gray-500">Followers</span>
            </Link>

            <Link
              to={`/profile/${userId}/following`}
              className="flex flex-col items-center hover:text-purple-600 transition-colors"
            >
              <div className="flex items-center">
                <UserPlus className="h-4 w-4 mr-1" />
                <span className="font-semibold">{stats.following_count}</span>
              </div>
              <span className="text-xs text-gray-500">Following</span>
            </Link>
          </div>

          <div className="flex space-x-2">
            {user && user.id !== userId && (
              <>
                <BlockButton
                  userId={userId}
                  initialIsBlocked={isBlocked}
                  onBlockChange={handleBlockChange}
                />
                {!isBlocked && (
                  <>
                    <FollowButton
                      userId={userId}
                      initialIsFollowing={stats.is_following}
                      onFollowChange={handleFollowChange}
                    />
                    <MessageButton userId={userId} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
