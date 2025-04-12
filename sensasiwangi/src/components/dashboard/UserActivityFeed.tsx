// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { MessageSquare, ThumbsUp, Award, Clock } from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
import {
  ForumThread,
  ForumReply,
  ForumVote,
  ForumUserBadge,
} from "../../types/forum";

interface ActivityItem {
  id: string;
  type: "thread" | "reply" | "vote" | "badge" | "level_up";
  title: string;
  description: string;
  created_at: string;
  link?: string;
}

export default function UserActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserActivity = async () => {
      try {
        setLoading(true);
        const allActivities: ActivityItem[] = [];

        // Fetch user's threads
        const { data: threads, error: threadsError } = await supabase
          .from("forum_threads")
          .select("id, title, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (threadsError) throw threadsError;

        if (threads) {
          const threadActivities = threads.map((thread: any) => ({
            id: `thread-${thread.id}`,
            type: "thread" as const,
            title: "Created a new thread",
            description: thread.title,
            created_at: thread.created_at,
            link: `/forum/thread/${thread.id}`,
          }));
          allActivities.push(...threadActivities);
        }

        // Fetch user's replies
        const { data: replies, error: repliesError } = await supabase
          .from("forum_replies")
          .select("id, content, thread_id, created_at, forum_threads(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (repliesError) throw repliesError;

        if (replies) {
          const replyActivities = replies.map((reply: any) => ({
            id: `reply-${reply.id}`,
            type: "reply" as const,
            title: "Replied to a thread",
            description: reply.forum_threads?.title || "Thread",
            created_at: reply.created_at,
            link: `/forum/thread/${reply.thread_id}#reply-${reply.id}`,
          }));
          allActivities.push(...replyActivities);
        }

        // Fetch votes received by the user
        const { data: votes, error: votesError } = await supabase
          .from("forum_votes")
          .select(
            `
            id, 
            vote_type, 
            created_at, 
            thread_id, 
            reply_id, 
            forum_threads(title), 
            forum_replies(content, thread_id)
          `,
          )
          .or(
            `thread_id.eq.any(${JSON.stringify(threads?.map((t: any) => t.id) || [])}),reply_id.eq.any(${JSON.stringify(replies?.map((r: any) => r.id) || [])})`,
          )
          .order("created_at", { ascending: false })
          .limit(5);

        if (votesError) throw votesError;

        if (votes) {
          const voteActivities = votes.map((vote: any) => {
            const isUpvote = vote.vote_type === "cendol";
            const targetType = vote.thread_id ? "thread" : "reply";
            const targetId =
              vote.thread_id ||
              (vote.reply_id ? vote.forum_replies?.thread_id : null);
            const targetTitle = vote.thread_id
              ? vote.forum_threads?.title
              : "a reply";

            return {
              id: `vote-${vote.id}`,
              type: "vote" as const,
              title: `Received ${isUpvote ? "an upvote" : "a downvote"}`,
              description: `Your ${targetType} about ${targetTitle} was ${isUpvote ? "upvoted" : "downvoted"}`,
              created_at: vote.created_at,
              link: targetId ? `/forum/thread/${targetId}` : undefined,
            };
          });
          allActivities.push(...voteActivities);
        }

        // Fetch user's badges
        const { data: badges, error: badgesError } = await supabase
          .from("forum_user_badges")
          .select("id, awarded_at, badge:badge_id(name, description)")
          .eq("user_id", user.id)
          .order("awarded_at", { ascending: false })
          .limit(5);

        if (badgesError) throw badgesError;

        if (badges) {
          const badgeActivities = badges.map((userBadge: any) => ({
            id: `badge-${userBadge.id}`,
            type: "badge" as const,
            title: "Earned a new badge",
            description: userBadge.badge?.name || "New achievement",
            created_at: userBadge.awarded_at,
          }));
          allActivities.push(...badgeActivities);
        }

        // Fetch user's level ups (from user_exp_history table if it exists)
        try {
          const { data: levelUps, error: levelUpsError } = await supabase
            .from("user_exp_history")
            .select("id, created_at, new_level")
            .eq("user_id", user.id)
            .eq("type", "level_up")
            .order("created_at", { ascending: false })
            .limit(3);

          if (!levelUpsError && levelUps) {
            const levelUpActivities = levelUps.map((levelUp: any) => ({
              id: `level-${levelUp.id}`,
              type: "level_up" as const,
              title: `Leveled up to Level ${levelUp.new_level}`,
              description: "Keep contributing to earn more experience!",
              created_at: levelUp.created_at,
            }));
            allActivities.push(...levelUpActivities);
          }
        } catch (err) {
          // Level up table might not exist yet, just continue
          console.log("Level up history not available:", err);
        }

        // Sort all activities by date (newest first)
        allActivities.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        // Take the most recent 10 activities
        setActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error("Error fetching user activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "thread":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "reply":
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case "vote":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "badge":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "level_up":
        return <Award className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "thread":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Thread
          </Badge>
        );
      case "reply":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Reply
          </Badge>
        );
      case "vote":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Vote
          </Badge>
        );
      case "badge":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Badge
          </Badge>
        );
      case "level_up":
        return (
          <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">
            Level Up
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Activity
          </Badge>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.email || ""}
                  />
                  <AvatarFallback>
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{activity.title}</p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Button variant="ghost" size="sm" className="w-full text-sm">
                View All Activity
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


