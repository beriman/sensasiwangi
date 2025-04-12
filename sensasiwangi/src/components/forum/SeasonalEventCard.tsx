// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Progress } from "../../components/ui/progress";
// @ts-ignore
import { Award, Calendar, Trophy } from "lucide-react";
// @ts-ignore
import { format } from "date-fns";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { getUserEventProgress, getActiveSeasonalEvents } from "../../lib/forum";
// @ts-ignore
import { ForumSeasonalEvent } from "../../types/forum";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";

interface SeasonalEventCardProps {
  className?: string;
}

const SeasonalEventCard: React.FC<SeasonalEventCardProps> = ({ className }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (user) {
        // Get events with user progress
        const userEvents = await getUserEventProgress(user.id);
        setEvents(userEvents);
      } else {
        // Just get active events without progress
        const activeEvents = await getActiveSeasonalEvents();
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error("Error fetching seasonal events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load seasonal events.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const getRequirementTypeLabel = (type: string) => {
    switch (type) {
      case "threads":
        return "Create Threads";
      case "replies":
        return "Post Replies";
      case "votes":
        return "Receive Votes";
      case "exp":
        return "Earn EXP Points";
      default:
        return type;
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Seasonal Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-gray-500">
            Loading events...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Seasonal Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">
              No active seasonal events
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Seasonal Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event: ForumSeasonalEvent & { challenges?: any[] }) => (
            <div key={event.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{event.name}</h3>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      Ends: {formatDate(event.end_date)}
                    </span>
                  </div>
                </div>
                <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {calculateDaysRemaining(event.end_date)} days left
                </div>
              </div>

              {event.description && (
                <p className="text-sm text-gray-600">{event.description}</p>
              )}

              {event.challenges && event.challenges.length > 0 && (
                <div className="space-y-3 mt-2">
                  {event.challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">
                            {challenge.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {getRequirementTypeLabel(
                              challenge.requirement_type,
                            )}
                            : {challenge.userProgress || 0}/
                            {challenge.requirement_count}
                          </p>
                        </div>
                        {challenge.badge && (
                          <div className="flex items-center">
                            <Award
                              className={`h-5 w-5 ${challenge.badgeAwarded ? "text-yellow-500" : "text-gray-300"}`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <Progress
                          value={
                            ((challenge.userProgress || 0) /
                              challenge.requirement_count) *
                            100
                          }
                          className="h-2"
                        />
                      </div>

                      {challenge.completed && (
                        <div className="mt-2 text-xs text-green-600 flex items-center">
                          <Trophy className="h-3 w-3 mr-1" /> Challenge
                          completed!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalEventCard;


