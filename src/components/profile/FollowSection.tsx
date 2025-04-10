import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import FollowButton from "./FollowButton";
import { Input } from "@/components/ui/input";

interface FollowSectionProps {
  userId: string;
  className?: string;
}

interface UserFollowData {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_following?: boolean;
}

export default function FollowSection({
  userId,
  className = "",
}: FollowSectionProps) {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserFollowData[]>([]);
  const [following, setFollowing] = useState<UserFollowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("followers");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        setLoading(true);

        // Get followers
        const { data: followerData, error: followerError } = await supabase
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", userId);

        if (followerError) throw followerError;

        // Get following
        const { data: followingData, error: followingError } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followingError) throw followingError;

        // Get follower user details
        const followerIds = followerData.map((item) => item.follower_id);
        const { data: followerUsers, error: followerUsersError } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .in("id", followerIds.length > 0 ? followerIds : ["none"]);

        if (followerUsersError) throw followerUsersError;

        // Get following user details
        const followingIds = followingData.map((item) => item.following_id);
        const { data: followingUsers, error: followingUsersError } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .in("id", followingIds.length > 0 ? followingIds : ["none"]);

        if (followingUsersError) throw followingUsersError;

        // Check if current user is following these users
        if (user) {
          const { data: currentUserFollowing, error: currentUserFollowingError } = await supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", user.id);

          if (currentUserFollowingError) throw currentUserFollowingError;

          const followingSet = new Set(currentUserFollowing.map(item => item.following_id));

          // Add is_following flag to follower users
          const followersWithFlag = followerUsers.map(follower => ({
            ...follower,
            is_following: followingSet.has(follower.id)
          }));

          // Add is_following flag to following users
          const followingWithFlag = followingUsers.map(following => ({
            ...following,
            is_following: followingSet.has(following.id)
          }));

          setFollowers(followersWithFlag);
          setFollowing(followingWithFlag);
        } else {
          setFollowers(followerUsers);
          setFollowing(followingUsers);
        }
      } catch (error) {
        console.error("Error fetching follow data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [userId, user]);

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update followers list
    setFollowers(prev => 
      prev.map(follower => 
        follower.id === userId ? { ...follower, is_following: isFollowing } : follower
      )
    );
    
    // Update following list
    setFollowing(prev => 
      prev.map(following => 
        following.id === userId ? { ...following, is_following: isFollowing } : following
      )
    );
  };

  const filteredFollowers = followers.filter(follower => 
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (follower.full_name && follower.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFollowing = following.filter(following => 
    following.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (following.full_name && following.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-500" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner text="Loading connections..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-500" />
          Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="followers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TabsContent value="followers" className="space-y-4">
            {filteredFollowers.length > 0 ? (
              <div className="space-y-3">
                {filteredFollowers.map((follower) => (
                  <div key={follower.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Link to={`/profile/${follower.id}`} className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={follower.avatar_url} alt={follower.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {getInitials(follower.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{follower.username}</p>
                        {follower.full_name && (
                          <p className="text-xs text-gray-500">{follower.full_name}</p>
                        )}
                      </div>
                    </Link>
                    {user && user.id !== follower.id && (
                      <FollowButton
                        userId={follower.id}
                        initialIsFollowing={follower.is_following}
                        onFollowChange={(isFollowing) => handleFollowChange(follower.id, isFollowing)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                {searchQuery ? (
                  <p className="text-gray-500">No followers match your search</p>
                ) : (
                  <>
                    <p className="text-gray-500">No followers yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Followers will appear here when people follow this profile
                    </p>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {filteredFollowing.length > 0 ? (
              <div className="space-y-3">
                {filteredFollowing.map((followingUser) => (
                  <div key={followingUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Link to={`/profile/${followingUser.id}`} className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={followingUser.avatar_url} alt={followingUser.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {getInitials(followingUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{followingUser.username}</p>
                        {followingUser.full_name && (
                          <p className="text-xs text-gray-500">{followingUser.full_name}</p>
                        )}
                      </div>
                    </Link>
                    {user && user.id !== followingUser.id && (
                      <FollowButton
                        userId={followingUser.id}
                        initialIsFollowing={true}
                        onFollowChange={(isFollowing) => handleFollowChange(followingUser.id, isFollowing)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                {searchQuery ? (
                  <p className="text-gray-500">No following users match your search</p>
                ) : (
                  <>
                    <p className="text-gray-500">Not following anyone yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Follow other users to see them here
                    </p>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
