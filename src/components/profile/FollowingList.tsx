import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { UserMinus, Loader2 } from "lucide-react";
import { getFollowing, unfollowUser } from "@/lib/social";
import { UserFollowing } from "@/types/social";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FollowingListProps {
  userId: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
  onUnfollow?: () => void;
}

export default function FollowingList({
  userId,
  limit = 5,
  showHeader = true,
  className = "",
  onUnfollow,
}: FollowingListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [following, setFollowing] = useState<UserFollowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowLoading, setUnfollowLoading] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);
        const data = await getFollowing(userId);
        setFollowing(data);
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId]);

  const handleUnfollow = async (followingId: string) => {
    if (!user) return;

    setUnfollowLoading((prev) => ({ ...prev, [followingId]: true }));

    try {
      await unfollowUser(user.id, followingId);
      toast({
        title: "Unfollowed",
        description: "You are no longer following this user",
      });

      // Remove from the following list
      setFollowing((prev) => prev.filter((f) => f.id !== followingId));

      // Notify parent component if callback is provided
      if (onUnfollow) {
        onUnfollow();
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    } finally {
      setUnfollowLoading((prev) => ({ ...prev, [followingId]: false }));
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
              Following
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner text="Loading following..." />
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
            Following ({following.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {following.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Not following anyone yet
          </p>
        ) : (
          <div className="space-y-3">
            {following.slice(0, limit).map((followingUser) => (
              <div
                key={followingUser.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Link to={`/profile/${followingUser.id}`}>
                    <Avatar className="h-10 w-10 mr-3 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
                      <AvatarImage
                        src={
                          followingUser.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${followingUser.id}`
                        }
                        alt={followingUser.full_name || "User"}
                      />
                      <AvatarFallback>
                        {(followingUser.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${followingUser.id}`}
                      className="hover:underline"
                    >
                      <p className="font-medium text-gray-900">
                        {followingUser.full_name || "User"}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-500">
                      Followed{" "}
                      {formatDistanceToNow(new Date(followingUser.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {user && user.id === userId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(followingUser.id)}
                    disabled={unfollowLoading[followingUser.id]}
                    className="h-8"
                  >
                    {unfollowLoading[followingUser.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserMinus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Unfollow</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}

            {following.length > limit && (
              <div className="text-center pt-2">
                <Link to={`/profile/${userId}/following`}>
                  <Button variant="link" size="sm" className="text-purple-600">
                    View all {following.length} following
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
