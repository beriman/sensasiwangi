import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import LeaderboardCard from "./LeaderboardCard";
import {
  Trophy,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Award,
  Calendar,
  Users,
  Crown,
  Medal,
  Star,
  TrendingUp,
  History,
  Filter,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface LeaderboardUser {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  exp: number;
  level: number;
  thread_count: number;
  reply_count: number;
  vote_count: number;
  badge_count: number;
  rank?: number;
  top_badges?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }[];
}

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

type TimeFrame = "weekly" | "monthly" | "yearly" | "all_time";
type LeaderboardType = "exp" | "threads" | "replies" | "votes" | "badges";
type CategoryFilter = string | null;

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly");
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("exp");
  const [userRank, setUserRank] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [minLevel, setMinLevel] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);

  // User history
  const [userHistory, setUserHistory] = useState<LeaderboardHistory[]>([]);
  const [userBestRank, setUserBestRank] = useState<UserBestRank | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame, leaderboardType, categoryFilter, minLevel]);

  useEffect(() => {
    if (user && showHistory) {
      fetchUserHistory();
      fetchUserBestRank();
    }
  }, [user, showHistory, timeFrame, leaderboardType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Call the get_leaderboard function with additional parameters
      const { data, error } = await supabase.rpc(
        'get_leaderboard',
        {
          time_frame: timeFrame,
          leaderboard_type: leaderboardType,
          limit_count: 50,
          category_filter: categoryFilter,
          min_level: minLevel
        }
      );

      if (error) throw error;

      // Process the data
      const leaderboardData = data as LeaderboardUser[];

      setUsers(leaderboardData);

      // Find current user's rank
      if (user) {
        const currentUser = leaderboardData.find(u => u.id === user.id);
        setUserRank(currentUser?.rank || null);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async () => {
    if (!user) return;

    try {
      setLoadingHistory(true);

      const { data, error } = await supabase.rpc(
        'get_user_leaderboard_history',
        {
          user_id_param: user.id,
          period_param: timeFrame,
          leaderboard_type_param: leaderboardType,
          limit_count: 10
        }
      );

      if (error) throw error;

      setUserHistory(data as LeaderboardHistory[]);
    } catch (error) {
      console.error("Error fetching user history:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard history",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchUserBestRank = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc(
        'get_user_best_rank',
        {
          user_id_param: user.id,
          period_param: timeFrame,
          leaderboard_type_param: leaderboardType
        }
      );

      if (error) throw error;

      setUserBestRank(data as UserBestRank);
    } catch (error) {
      console.error("Error fetching user best rank:", error);
    }
  };

  const getLeaderboardIcon = () => {
    switch (leaderboardType) {
      case "exp":
        return <Star className="h-6 w-6 text-yellow-500" />;
      case "threads":
        return <MessageSquare className="h-6 w-6 text-blue-500" />;
      case "replies":
        return <Users className="h-6 w-6 text-green-500" />;
      case "votes":
        return <ThumbsUp className="h-6 w-6 text-purple-500" />;
      case "badges":
        return <Award className="h-6 w-6 text-red-500" />;
      default:
        return <Trophy className="h-6 w-6 text-amber-500" />;
    }
  };

  const getLeaderboardTitle = () => {
    const timeFrameText = timeFrame === "weekly" ? "Weekly" : timeFrame === "monthly" ? "Monthly" : "All-Time";

    switch (leaderboardType) {
      case "exp":
        return `${timeFrameText} Experience Leaders`;
      case "threads":
        return `${timeFrameText} Thread Creators`;
      case "replies":
        return `${timeFrameText} Top Responders`;
      case "votes":
        return `${timeFrameText} Most Upvoted`;
      case "badges":
        return `${timeFrameText} Badge Collectors`;
      default:
        return `${timeFrameText} Leaderboard`;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-amber-100 text-amber-800">
        <Crown className="h-3 w-3 mr-1" />
        Champion
      </Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-gray-100 text-gray-800">
        <Medal className="h-3 w-3 mr-1" />
        Silver
      </Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-amber-100 text-amber-800">
        <Medal className="h-3 w-3 mr-1" />
        Bronze
      </Badge>;
    } else if (rank <= 10) {
      return <Badge className="bg-blue-100 text-blue-800">
        <Star className="h-3 w-3 mr-1" />
        Top 10
      </Badge>;
    }

    return null;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <Trophy className="h-8 w-8 text-amber-500 mr-3" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Community Leaderboard
            </h1>
            <p className="text-gray-500 mt-1">
              Recognize top contributors in our community
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <Select
            value={timeFrame}
            onValueChange={(value) => setTimeFrame(value as TimeFrame)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Hide History" : "My History"}
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Category</h3>
                <Select
                  value={categoryFilter || ""}
                  onValueChange={(value) => setCategoryFilter(value || null)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="perfume">Perfume</SelectItem>
                    <SelectItem value="fragrance">Fragrance</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="discussion">Discussions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Minimum Level</h3>
                <Select
                  value={minLevel.toString()}
                  onValueChange={(value) => setMinLevel(parseInt(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Minimum Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">All Levels</SelectItem>
                    <SelectItem value="5">Level 5+</SelectItem>
                    <SelectItem value="10">Level 10+</SelectItem>
                    <SelectItem value="20">Level 20+</SelectItem>
                    <SelectItem value="30">Level 30+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )

      <Tabs defaultValue="exp" className="w-full" onValueChange={(value) => setLeaderboardType(value as LeaderboardType)}>
        <TabsList className="mb-4">
          <TabsTrigger value="exp" className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="threads" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            Threads
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Replies
          </TabsTrigger>
          <TabsTrigger value="votes" className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" />
            Votes
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            Badges
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getLeaderboardIcon()}
                <CardTitle className="ml-2">{getLeaderboardTitle()}</CardTitle>
              </div>

              {userRank && (
                <Badge variant="outline" className="ml-auto">
                  Your Rank: #{userRank}
                </Badge>
              )}
            </div>
            <CardDescription>
              {timeFrame === "weekly"
                ? "Rankings for the past 7 days"
                : timeFrame === "monthly"
                  ? "Rankings for the past 30 days"
                  : "All-time community rankings"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No data available for this leaderboard
              </div>
            ) : (
              <div className="space-y-4">
                {/* User History Section */}
                {showHistory && user && (
                  <div className="mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Your Leaderboard History</CardTitle>
                        <CardDescription>
                          Track your progress over time in the {timeFrame} {leaderboardType} leaderboard
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingHistory ? (
                          <div className="flex justify-center py-6">
                            <LoadingSpinner size="md" />
                          </div>
                        ) : userHistory.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            No history data available yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Best Rank */}
                            {userBestRank && (
                              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium">Your Best Rank</h3>
                                    <p className="text-sm text-gray-500">
                                      Achieved on {new Date(userBestRank.best_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">#{userBestRank.best_rank}</div>
                                    <div className="text-sm">
                                      {leaderboardType === "exp" && `${userBestRank.best_score} XP`}
                                      {leaderboardType === "threads" && `${userBestRank.best_score} Threads`}
                                      {leaderboardType === "replies" && `${userBestRank.best_score} Replies`}
                                      {leaderboardType === "votes" && `${userBestRank.best_score} Votes`}
                                      {leaderboardType === "badges" && `${userBestRank.best_score} Badges`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* History Chart */}
                            <div>
                              <h3 className="text-sm font-medium mb-2">Rank History</h3>
                              <div className="h-40 relative">
                                {userHistory.length > 0 && (
                                  <div className="flex items-end justify-between h-full">
                                    {userHistory.map((entry, index) => {
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
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* User History Section */}
                {showHistory && user && (
                  <div className="mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Your Leaderboard History</CardTitle>
                        <CardDescription>
                          Track your progress over time in the {timeFrame} {leaderboardType} leaderboard
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingHistory ? (
                          <div className="flex justify-center py-6">
                            <LoadingSpinner size="md" />
                          </div>
                        ) : userHistory.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            No history data available yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Best Rank */}
                            {userBestRank && (
                              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium">Your Best Rank</h3>
                                    <p className="text-sm text-gray-500">
                                      Achieved on {new Date(userBestRank.best_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">#{userBestRank.best_rank}</div>
                                    <div className="text-sm">
                                      {leaderboardType === "exp" && `${userBestRank.best_score} XP`}
                                      {leaderboardType === "threads" && `${userBestRank.best_score} Threads`}
                                      {leaderboardType === "replies" && `${userBestRank.best_score} Replies`}
                                      {leaderboardType === "votes" && `${userBestRank.best_score} Votes`}
                                      {leaderboardType === "badges" && `${userBestRank.best_score} Badges`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* History Chart */}
                            <div>
                              <h3 className="text-sm font-medium mb-2">Rank History</h3>
                              <div className="h-40 relative">
                                {userHistory.length > 0 && (
                                  <div className="flex items-end justify-between h-full">
                                    {userHistory.map((entry, index) => {
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
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Top 3 Users */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  {users.slice(0, 3).map((user, index) => (
                    <Card key={user.id} className={`flex-1 ${index === 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
                      <CardContent className="pt-6 text-center">
                        <div className="relative inline-block">
                          <Avatar className="h-20 w-20 mx-auto border-4 border-white shadow-md">
                            <AvatarImage
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                              alt={user.username}
                            />
                            <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                            {index === 0 ? (
                              <Crown className="h-6 w-6 text-amber-500" />
                            ) : index === 1 ? (
                              <Medal className="h-6 w-6 text-gray-400" />
                            ) : (
                              <Medal className="h-6 w-6 text-amber-700" />
                            )}
                          </div>
                        </div>

                        <h3 className="font-semibold text-lg mt-3">
                          <Link to={`/profile/${user.id}`} className="hover:underline">
                            {user.username}
                          </Link>
                        </h3>

                        <div className="mt-1 text-gray-500 text-sm">
                          Level {user.level}
                        </div>

                        <div className="mt-3 font-bold text-xl">
                          {leaderboardType === "exp" && `${user.exp.toLocaleString()} XP`}
                          {leaderboardType === "threads" && `${user.thread_count} Threads`}
                          {leaderboardType === "replies" && `${user.reply_count} Replies`}
                          {leaderboardType === "votes" && `${user.vote_count} Votes`}
                          {leaderboardType === "badges" && `${user.badge_count} Badges`}
                        </div>

                        {user.top_badges && user.top_badges.length > 0 && (
                          <div className="mt-3 flex justify-center gap-1">
                            {user.top_badges.slice(0, 3).map(badge => (
                              <div key={badge.id} className="text-lg" title={badge.name}>
                                {badge.icon}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Rest of the Users */}
                <div className="space-y-2">
                  {users.slice(3).map((leaderboardUser) => (
                    <LeaderboardCard
                      key={leaderboardUser.id}
                      user={leaderboardUser}
                      highlightCurrentUser={leaderboardUser.id === user?.id}
                      showRank={true}
                      leaderboardType={leaderboardType}
                      onClick={() => navigate(`/profile/${leaderboardUser.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
