import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare,
  ThumbsUp,
  Award,
  Clock,
  Users,
  Eye
} from "lucide-react";

interface ProfileMetricsProps {
  userId: string;
  className?: string;
}

interface UserMetrics {
  total_posts: number;
  helpful_posts: number;
  total_votes: number;
  avg_response_time: number;
  followers_count: number;
  total_views: number;
  helpfulness_ratio: number;
}

export default function ProfileMetrics({
  userId,
  className = ""
}: ProfileMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  
  useEffect(() => {
    fetchUserMetrics();
  }, [userId]);
  
  const fetchUserMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch total posts (threads + replies)
      const { data: threadsData, error: threadsError } = await supabase
        .from("forum_threads")
        .select("id", { count: "exact" })
        .eq("user_id", userId);
      
      if (threadsError) throw threadsError;
      
      const { data: repliesData, error: repliesError } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("user_id", userId);
      
      if (repliesError) throw repliesError;
      
      // Fetch helpful posts (threads + replies with votes > 0)
      const { data: helpfulThreadsData, error: helpfulThreadsError } = await supabase
        .from("forum_threads")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gt("vote_count", 0);
      
      if (helpfulThreadsError) throw helpfulThreadsError;
      
      const { data: helpfulRepliesData, error: helpfulRepliesError } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gt("vote_count", 0);
      
      if (helpfulRepliesError) throw helpfulRepliesError;
      
      // Fetch total votes received
      const { data: threadVotesData, error: threadVotesError } = await supabase
        .from("forum_threads")
        .select("vote_count")
        .eq("user_id", userId);
      
      if (threadVotesError) throw threadVotesError;
      
      const { data: replyVotesData, error: replyVotesError } = await supabase
        .from("forum_replies")
        .select("vote_count")
        .eq("user_id", userId);
      
      if (replyVotesError) throw replyVotesError;
      
      // Fetch followers count
      const { data: followersData, error: followersError } = await supabase
        .from("user_follows")
        .select("id", { count: "exact" })
        .eq("followed_id", userId);
      
      if (followersError) throw followersError;
      
      // Fetch total views on threads
      const { data: viewsData, error: viewsError } = await supabase
        .from("forum_threads")
        .select("view_count")
        .eq("user_id", userId);
      
      if (viewsError) throw viewsError;
      
      // Calculate metrics
      const totalPosts = (threadsData?.length || 0) + (repliesData?.length || 0);
      const helpfulPosts = (helpfulThreadsData?.length || 0) + (helpfulRepliesData?.length || 0);
      
      const totalVotes = threadVotesData?.reduce((sum, thread) => sum + (thread.vote_count || 0), 0) || 0
        + replyVotesData?.reduce((sum, reply) => sum + (reply.vote_count || 0), 0) || 0;
      
      const totalViews = viewsData?.reduce((sum, thread) => sum + (thread.view_count || 0), 0) || 0;
      
      // Calculate helpfulness ratio (helpful posts / total posts)
      const helpfulnessRatio = totalPosts > 0 ? (helpfulPosts / totalPosts) * 100 : 0;
      
      // Set metrics
      setMetrics({
        total_posts: totalPosts,
        helpful_posts: helpfulPosts,
        total_votes: totalVotes,
        avg_response_time: 0, // This would require more complex calculation
        followers_count: followersData?.length || 0,
        total_views: totalViews,
        helpfulness_ratio: helpfulnessRatio
      });
    } catch (error) {
      console.error("Error fetching user metrics:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Contribution Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading metrics..." />
        </CardContent>
      </Card>
    );
  }
  
  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Contribution Metrics</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <p className="text-gray-500">No metrics available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Contribution Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <MessageSquare className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.total_posts}</span>
            <span className="text-xs text-gray-500">Total Posts</span>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <ThumbsUp className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.total_votes}</span>
            <span className="text-xs text-gray-500">Votes Received</span>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <Award className="h-5 w-5 text-amber-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.helpfulness_ratio.toFixed(0)}%</span>
            <span className="text-xs text-gray-500">Helpfulness Ratio</span>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <Eye className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.total_views}</span>
            <span className="text-xs text-gray-500">Content Views</span>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <Users className="h-5 w-5 text-indigo-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.followers_count}</span>
            <span className="text-xs text-gray-500">Followers</span>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-md bg-gray-50">
            <Clock className="h-5 w-5 text-pink-500 mb-1" />
            <span className="text-lg font-semibold">{metrics.helpful_posts}</span>
            <span className="text-xs text-gray-500">Helpful Posts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
