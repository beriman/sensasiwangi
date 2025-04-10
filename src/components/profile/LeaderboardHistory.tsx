import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy, Star, MessageSquare, MessageCircle, ThumbsUp, Award, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ShareAchievement from "@/components/gamification/ShareAchievement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaderboardHistory {
  rank: number;
  score: number;
  snapshot_date: string;
  period: string;
  leaderboard_type: string;
}

interface UserBestRank {
  best_rank: number;
  best_score: number;
  best_date: string;
}

interface LeaderboardHistoryProps {
  userId: string;
  className?: string;
}

export default function LeaderboardHistory({
  userId,
  className = "",
}: LeaderboardHistoryProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("monthly");
  const [leaderboardType, setLeaderboardType] = useState<string>("exp");
  const [history, setHistory] = useState<LeaderboardHistory[]>([]);
  const [bestRank, setBestRank] = useState<UserBestRank | null>(null);
  const [currentRank, setCurrentRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboardHistory();
    fetchBestRank();
    fetchCurrentRank();
  }, [userId, period, leaderboardType]);

  const fetchLeaderboardHistory = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'get_user_leaderboard_history',
        {
          user_id_param: userId,
          period_param: period,
          leaderboard_type_param: leaderboardType,
          limit_count: 10
        }
      );

      if (error) throw error;

      setHistory(data as LeaderboardHistory[]);
    } catch (error) {
      console.error("Error fetching leaderboard history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBestRank = async () => {
    try {
      const { data, error } = await supabase.rpc(
        'get_user_best_rank',
        {
          user_id_param: userId,
          period_param: period,
          leaderboard_type_param: leaderboardType
        }
      );

      if (error) throw error;

      setBestRank(data as UserBestRank);
    } catch (error) {
      console.error("Error fetching best rank:", error);
    }
  };

  const fetchCurrentRank = async () => {
    try {
      // Get current leaderboard to find user's rank
      const { data, error } = await supabase.rpc(
        'get_leaderboard',
        {
          time_frame: period,
          leaderboard_type: leaderboardType,
          limit_count: 100
        }
      );

      if (error) throw error;

      // Find user in leaderboard
      const userRank = data.find((item: any) => item.id === userId)?.rank;
      setCurrentRank(userRank || null);
    } catch (error) {
      console.error("Error fetching current rank:", error);
    }
  };

  const getLeaderboardTypeIcon = () => {
    switch (leaderboardType) {
      case "exp":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "threads":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "replies":
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case "votes":
        return <ThumbsUp className="h-5 w-5 text-amber-500" />;
      case "badges":
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLeaderboardTypeLabel = () => {
    switch (leaderboardType) {
      case "exp":
        return "Experience";
      case "threads":
        return "Threads";
      case "replies":
        return "Replies";
      case "votes":
        return "Votes";
      case "badges":
        return "Badges";
      default:
        return "Leaderboard";
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      case "all_time":
        return "All Time";
      default:
        return "Leaderboard";
    }
  };

  if (loading && history.length === 0) {
    return (
      <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Leaderboard History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading leaderboard history..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Leaderboard History
          </div>

          {currentRank && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Current Rank: #{currentRank}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={leaderboardType}
            onValueChange={setLeaderboardType}
          >
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exp">Experience</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
              <SelectItem value="replies">Replies</SelectItem>
              <SelectItem value="votes">Votes</SelectItem>
              <SelectItem value="badges">Badges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Best Rank Card */}
        {bestRank && (
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">Best Rank</h3>
                <p className="text-xs text-blue-600 mt-1">
                  Achieved on {new Date(bestRank.best_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700">#{bestRank.best_rank}</div>
                <div className="flex items-center text-xs text-blue-600">
                  {getLeaderboardTypeIcon()}
                  <span className="ml-1">
                    {bestRank.best_score} {getLeaderboardTypeLabel()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <ShareAchievement
                title={`I reached rank #${bestRank.best_rank} on the ${getPeriodLabel()} ${getLeaderboardTypeLabel()} leaderboard on Sensasiwangi!`}
                description={`With a score of ${bestRank.best_score} ${getLeaderboardTypeLabel()}`}
                shareUrl={`${window.location.origin}/share/leaderboard/${bestRank.id}`}
                size="sm"
              />
            </div>
          </div>
        )}

        {history.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-3">{getPeriodLabel()} {getLeaderboardTypeLabel()} Rank History</h3>

            {/* Rank History Chart */}
            <div className="h-40 relative mb-4">
              <div className="flex items-end justify-between h-full">
                {history.map((entry, index) => {
                  // Invert the rank for display (lower rank = higher bar)
                  const maxRank = 50; // Assuming max rank is 50
                  const invertedHeight = ((maxRank - entry.rank) / maxRank) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-blue-500 rounded-t-sm"
                        style={{ height: `${Math.max(5, invertedHeight)}%` }}
                        title={`Rank #${entry.rank} with ${entry.score} ${leaderboardType}`}
                      />
                      <div className="text-xs mt-1">{new Date(entry.snapshot_date).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rank History Table */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-center">Rank</th>
                    <th className="px-4 py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 text-left">
                        {new Date(entry.snapshot_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-center font-medium">
                        #{entry.rank}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No leaderboard history available</p>
            <p className="text-sm text-gray-400 mt-1">
              Participate in the community to appear on the leaderboard!
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = "/forum/section/leaderboard"}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            View Full Leaderboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
