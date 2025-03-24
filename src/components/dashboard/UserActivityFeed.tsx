import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Award, Clock } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { formatDistanceToNow } from "date-fns";

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

    // This is a mock function that would normally fetch from the database
    const fetchUserActivity = async () => {
      try {
        setLoading(true);

        // In a real implementation, we would fetch from the database
        // For now, we'll use mock data
        const mockActivities: ActivityItem[] = [
          {
            id: "1",
            type: "thread",
            title: "Created a new thread",
            description: "How to create your first perfume blend",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            link: "/forum/thread/123",
          },
          {
            id: "2",
            type: "reply",
            title: "Replied to a thread",
            description: "Best jasmine notes for summer fragrances",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24,
            ).toISOString(), // 1 day ago
            link: "/forum/thread/456",
          },
          {
            id: "3",
            type: "vote",
            title: "Received an upvote",
            description: "Your thread about citrus notes was upvoted",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2,
            ).toISOString(), // 2 days ago
            link: "/forum/thread/789",
          },
          {
            id: "4",
            type: "badge",
            title: "Earned a new badge",
            description: "Thread Starter: Create your first 5 threads",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 3,
            ).toISOString(), // 3 days ago
          },
          {
            id: "5",
            type: "level_up",
            title: "Leveled up to Level 2",
            description: "Keep contributing to earn more experience!",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 5,
            ).toISOString(), // 5 days ago
          },
        ];

        setActivities(mockActivities);
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
      case "reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
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
