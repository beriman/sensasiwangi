import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { blockUser, unblockUser, isUserBlocked } from "@/lib/privacy";

interface BlockButtonProps {
  userId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onBlockChange?: (isBlocked: boolean) => void;
  initialIsBlocked?: boolean;
}

export default function BlockButton({
  userId,
  variant = "outline",
  size = "sm",
  className = "",
  onBlockChange,
  initialIsBlocked = false,
}: BlockButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUserBlocked, setIsUserBlocked] = useState(initialIsBlocked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If initialIsBlocked is provided, use it
    if (initialIsBlocked !== undefined) {
      setIsUserBlocked(initialIsBlocked);
      return;
    }

    // Otherwise check the block status
    const checkBlockStatus = async () => {
      if (!user || user.id === userId) return;

      try {
        const blocked = await isUserBlocked(user.id, userId);
        setIsUserBlocked(blocked);
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockStatus();
  }, [user, userId, initialIsBlocked]);

  const handleBlockToggle = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to block users",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Don't allow blocking yourself
    if (user.id === userId) {
      toast({
        title: "Cannot Block",
        description: "You cannot block yourself",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isUserBlocked) {
        await unblockUser(user.id, userId);
        toast({
          title: "User Unblocked",
          description: "You have unblocked this user",
        });
      } else {
        await blockUser(user.id, userId);
        toast({
          title: "User Blocked",
          description: "You have blocked this user",
        });
      }

      // Toggle the block state
      setIsUserBlocked(!isUserBlocked);

      // Notify parent component if callback is provided
      if (onBlockChange) {
        onBlockChange(!isUserBlocked);
      }
    } catch (error) {
      console.error("Error toggling block:", error);
      toast({
        title: "Error",
        description: "Failed to update block status",
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
      variant={isUserBlocked ? "destructive" : variant}
      size={size}
      onClick={handleBlockToggle}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isUserBlocked ? (
        <ShieldCheck className="h-4 w-4 mr-2" />
      ) : (
        <ShieldAlert className="h-4 w-4 mr-2" />
      )}
      {isUserBlocked ? "Unblock" : "Block"}
    </Button>
  );
}
