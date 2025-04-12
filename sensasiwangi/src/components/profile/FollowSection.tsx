// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { Users, ChevronRight, UserPlus } from "lucide-react";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface FollowSectionProps {
  userId: string;
  limit?: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
  level?: number;
  is_following?: boolean;
}

export default function FollowSection({ userId, limit = 6 }: FollowSectionProps) {
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState("followers");

  useEffect(() => {
    if (!userId) return;

    const fetchFollowData = async () => {
      try {
        setLoading(true);
        
        // Get followers
        const { data: followerData, error: followerError } = await supabase
          .from("user_follows")
          .select(`
            follower:follower_id (
              id,
              username,
              full_name,
              avatar_url,
              is_online,
              last_seen,
              level
            )
          `)
          .eq("following_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        
        if (followerError) throw followerError;
        
        // Get following
        const { data: followingData, error: followingError } = await supabase
          .from("user_follows")
          .select(`
            following:following_id (
              id,
              username,
              full_name,
              avatar_url,
              is_online,
              last_seen,
              level
            )
          `)
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        
        if (followingError) throw followingError;
        
        // Get counts
        const { count: followerCount, error: followerCountError } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId);
        
        if (followerCountError) throw followerCountError;
        
        const { count: followingCount, error: followingCountError } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId);
        
        if (followingCountError) throw followingCountError;
        
        // Transform data
        const transformedFollowers = followerData?.map(item => ({
          id: item.follower.id,
          username: item.follower.username,
          full_name: item.follower.full_name,
          avatar_url: item.follower.avatar_url,
          is_online: item.follower.is_online,
          last_seen: item.follower.last_seen,
          level: item.follower.level,
        })) || [];
        
        const transformedFollowing = followingData?.map(item => ({
          id: item.following.id,
          username: item.following.username,
          full_name: item.following.full_name,
          avatar_url: item.following.avatar_url,
          is_online: item.following.is_online,
          last_seen: item.following.last_seen,
          level: item.following.level,
        })) || [];
        
        setFollowers(transformedFollowers);
        setFollowing(transformedFollowing);
        setFollowerCount(followerCount || 0);
        setFollowingCount(followingCount || 0);
      } catch (error) {
        console.error("Error fetching follow data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFollowData();
  }, [userId, limit]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Connections
          </div>
          <Link to="/profile?tab=connections">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="followers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="followers" className="text-sm">
              Followers ({followerCount})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-sm">
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : followers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {followers.map((follower) => (
                  <Link
                    key={follower.id}
                    to={`/profile/${follower.username}`}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 flex flex-col items-center text-center transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 mb-2">
                        <AvatarImage
                          src={follower.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.id}`}
                          alt={follower.username}
                        />
                        <AvatarFallback>{follower.username[0]}</AvatarFallback>
                      </Avatar>
                      {follower.is_online && (
                        <span className="absolute bottom-2 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                    </div>
                    <div className="font-medium text-sm truncate w-full">
                      {follower.username}
                    </div>
                    {follower.level && (
                      <Badge variant="outline" className="mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Level {follower.level}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No followers yet</p>
                <p className="text-sm text-gray-400">
                  Be active in the community to attract followers!
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : following.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {following.map((follow) => (
                  <Link
                    key={follow.id}
                    to={`/profile/${follow.username}`}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 flex flex-col items-center text-center transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 mb-2">
                        <AvatarImage
                          src={follow.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follow.id}`}
                          alt={follow.username}
                        />
                        <AvatarFallback>{follow.username[0]}</AvatarFallback>
                      </Avatar>
                      {follow.is_online && (
                        <span className="absolute bottom-2 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                    </div>
                    <div className="font-medium text-sm truncate w-full">
                      {follow.username}
                    </div>
                    {follow.level && (
                      <Badge variant="outline" className="mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Level {follow.level}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You're not following anyone yet</p>
                <Button size="sm" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Find People to Follow
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


