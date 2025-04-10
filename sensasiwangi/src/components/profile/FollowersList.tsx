import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { getFollowers } from "@/lib/social";
import { UserFollower } from "@/types/social";
import { useAuth } from "../../../supabase/auth";
import { followUser, unfollowUser } from "@/lib/social";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FollowersListProps {
  userId: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export default function FollowersList({
  userId,
  limit = 5,
  showHeader = true,
  className = "",
}: FollowersListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<UserFollower[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);
        const data = await getFollowers(userId, user?.id);
        setFollowers(data);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, user]);

  const handleFollowToggle = async (
    followerId: string,
    isFollowing: boolean,
  ) => {
    if (!user) return;

    // Don't allow following yourself
    if (user.id === followerId) return;

    setFollowLoading((prev) => ({ ...prev, [followerId]: true }));

    try {
      if (isFollowing) {
        await unfollowUser(user.id, followerId);
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        await followUser(user.id, followerId);
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }

      // Update the followers list
      setFollowers((prev) =>
        prev.map((follower) =>
          follower.id === followerId
            ? { ...follower, is_following: !isFollowing }
            : follower,
        ),
      );
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setFollowLoading((prev) => ({ ...prev, [followerId]: false }));
    }
  };

  if (loading) {
    return (
      <Card
        className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}
      >
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-900">
              Followers
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner text="Loading followers..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-900">
            Followers ({followers.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {followers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No followers yet</p>
        ) : (
          <div className="space-y-3">
            {followers.slice(0, limit).map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Link to={`/profile/${follower.id}`}>
                    <Avatar className="h-10 w-10 mr-3 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
                      <AvatarImage
                        src={
                          follower.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.id}`
                        }
                        alt={follower.full_name || "User"}
                      />
                      <AvatarFallback>
                        {(follower.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${follower.id}`}
                      className="hover:underline"
                    >
                      <p className="font-medium text-gray-900">
                        {follower.full_name || "User"}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-500">
                      Followed{" "}
                      {formatDistanceToNow(new Date(follower.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {user && user.id !== follower.id && (
                  <Button
                    variant={follower.is_following ? "outline" : "default"}
                    size="sm"
                    onClick={() =>
                      handleFollowToggle(
                        follower.id,
                        follower.is_following || false,
                      )
                    }
                    disabled={followLoading[follower.id]}
                    className="h-8"
                  >
                    {followLoading[follower.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : follower.is_following ? (
                      <>
                        <UserMinus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Follow</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}

            {followers.length > limit && (
              <div className="text-center pt-2">
                <Link to={`/profile/${userId}/followers`}>
                  <Button variant="link" size="sm" className="text-purple-600">
                    View all {followers.length} followers
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
