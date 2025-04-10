import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, format } from "date-fns";
import {
  MessageSquare,
  Award,
  Trophy,
  ThumbsUp,
  Users,
  Star,
  Calendar
} from "lucide-react";

interface ProfileTimelineProps {
  userId: string;
  className?: string;
  limit?: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  icon: React.ReactNode;
  color: string;
  date: string;
  link: string | null;
}

export default function ProfileTimeline({
  userId,
  className = "",
  limit = 5
}: ProfileTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  
  useEffect(() => {
    fetchTimelineEvents();
  }, [userId, limit]);
  
  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch user's threads
      const { data: threadsData, error: threadsError } = await supabase
        .from("forum_threads")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (threadsError) throw threadsError;
      
      // Fetch user's badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("forum_user_badges")
        .select(`
          id,
          awarded_at,
          badge:badge_id (
            name,
            description
          )
        `)
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false })
        .limit(limit);
      
      if (badgesError) throw badgesError;
      
      // Fetch user's achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("forum_user_achievements")
        .select(`
          id,
          completed_at,
          achievement:achievement_id (
            title,
            description
          )
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(limit);
      
      if (achievementsError) throw achievementsError;
      
      // Fetch user's join date
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", userId)
        .single();
      
      if (userError) throw userError;
      
      // Combine all events
      const allEvents: TimelineEvent[] = [];
      
      // Add threads
      threadsData?.forEach(thread => {
        allEvents.push({
          id: `thread-${thread.id}`,
          event_type: 'thread',
          title: 'Created a new thread',
          description: thread.title,
          icon: <MessageSquare className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800',
          date: thread.created_at,
          link: `/forum/thread/${thread.id}`
        });
      });
      
      // Add badges
      badgesData?.forEach(badge => {
        allEvents.push({
          id: `badge-${badge.id}`,
          event_type: 'badge',
          title: 'Earned a badge',
          description: badge.badge.name,
          icon: <Award className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800',
          date: badge.awarded_at,
          link: null
        });
      });
      
      // Add achievements
      achievementsData?.forEach(achievement => {
        allEvents.push({
          id: `achievement-${achievement.id}`,
          event_type: 'achievement',
          title: 'Completed an achievement',
          description: achievement.achievement.title,
          icon: <Trophy className="h-4 w-4" />,
          color: 'bg-amber-100 text-amber-800',
          date: achievement.completed_at,
          link: null
        });
      });
      
      // Add join date
      if (userData) {
        allEvents.push({
          id: 'join',
          event_type: 'join',
          title: 'Joined Sensasiwangi',
          description: 'Started the journey',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          date: userData.created_at,
          link: null
        });
      }
      
      // Sort by date (newest first)
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Limit the number of events
      setEvents(allEvents.slice(0, limit));
    } catch (error) {
      console.error("Error fetching timeline events:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading timeline..." />
        </CardContent>
      </Card>
    );
  }
  
  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Activities will appear here as you engage with the community
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l border-gray-200">
          {events.map((event, index) => (
            <div key={event.id} className={`mb-6 ${index === events.length - 1 ? '' : ''}`}>
              <div className="absolute -left-2">
                <div className={`rounded-full p-1 ${event.color}`}>
                  {event.icon}
                </div>
              </div>
              <div className="ml-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{event.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(event.date), "PPp")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
