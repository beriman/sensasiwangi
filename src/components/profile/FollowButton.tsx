// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { followUser, unfollowUser, isFollowing } from "../../lib/social";

interface FollowButtonProps {
  userId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
  initialIsFollowing?: boolean;
}

export default function FollowButton({
  userId,
  variant = "default",
  size = "sm",
  className = "",
  onFollowChange,
  initialIsFollowing = false,
}: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUserFollowing, setIsUserFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If initialIsFollowing is provided, use it
    if (initialIsFollowing !== undefined) {
      setIsUserFollowing(initialIsFollowing);
      return;
    }

    // Otherwise check the follow status
    const checkFollowStatus = async () => {
      if (!user || user.id === userId) return;

      try {
        const following = await isFollowing(user.id, userId);
        setIsUserFollowing(following);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [user, userId, initialIsFollowing]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to follow users",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Don't allow following yourself
    if (user.id === userId) {
      toast({
        title: "Cannot Follow",
        description: "You cannot follow yourself",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isUserFollowing) {
        await unfollowUser(user.id, userId);
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        await followUser(user.id, userId);
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }

      // Toggle the follow state
      setIsUserFollowing(!isUserFollowing);

      // Notify parent component if callback is provided
      if (onFollowChange) {
        onFollowChange(!isUserFollowing);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show the button if viewing your own profile
  if (user && user.id === userId) {
    return null;
  }

  return (
    <Button
      variant={isUserFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollowToggle}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isUserFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isUserFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}


