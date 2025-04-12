// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { ShieldCheck, AlertCircle } from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { getBlockedUsers, unblockUser } from "../../lib/privacy";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { Link } from "react-router-dom";

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_user: {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface BlockedUsersListProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export default function BlockedUsersList({
  limit,
  showHeader = true,
  className = "",
}: BlockedUsersListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getBlockedUsers(user.id);
        setBlockedUsers(data as unknown as BlockedUser[]);
      } catch (error) {
        console.error("Error fetching blocked users:", error);
        toast({
          title: "Error",
          description: "Failed to load blocked users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, [user, toast]);

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;

    try {
      await unblockUser(user.id, blockedId);

      // Update the local state
      setBlockedUsers(
        blockedUsers.filter((item) => item.blocked_id !== blockedId),
      );

      toast({
        title: "User Unblocked",
        description: "You have unblocked this user",
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string = "User") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Blocked Users
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner text="Loading blocked users..." />
        </CardContent>
      </Card>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <Card className={`${className}`}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Blocked Users
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">You haven't blocked any users</p>
            <p className="text-sm text-gray-400">
              When you block someone, they won't be able to see your profile or
              interact with you
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Apply limit if provided
  const displayedUsers = limit ? blockedUsers.slice(0, limit) : blockedUsers;

  return (
    <Card className={`${className}`}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Blocked Users</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ul className="space-y-4">
          {displayedUsers.map((blockedUser) => (
            <li
              key={blockedUser.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={blockedUser.blocked_user.avatar_url || ""}
                    alt={blockedUser.blocked_user.username || "User"}
                  />
                  <AvatarFallback>
                    {getInitials(
                      blockedUser.blocked_user.username ||
                        blockedUser.blocked_user.full_name,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {blockedUser.blocked_user.full_name ||
                      blockedUser.blocked_user.username ||
                      "User"}
                  </p>
                  {blockedUser.blocked_user.username && (
                    <p className="text-sm text-gray-500">
                      @{blockedUser.blocked_user.username}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(blockedUser.blocked_id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}


