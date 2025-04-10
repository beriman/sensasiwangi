import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Lock, Info, Star, Filter, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ShareAchievement from "@/components/gamification/ShareAchievement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "content" | "community" | "reputation" | "special";
  icon: string;
  color: string;
  tier: number;
  requirement_type: string;
  requirement_count: number;
  reward_exp: number;
  reward_badge_id?: string;
}

interface UserAchievement extends Achievement {
  completed: boolean;
  completed_at?: string;
  progress?: number;
  progress_percentage?: number;
}

interface AchievementCollectionProps {
  userId: string;
  className?: string;
}

export default function AchievementCollection({
  userId,
  className = "",
}: AchievementCollectionProps) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [completedAchievements, setCompletedAchievements] = useState<UserAchievement[]>([]);
  const [inProgressAchievements, setInProgressAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("completed");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    totalExp: 0,
    earnedExp: 0,
    completionPercentage: 0
  });

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);

      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("forum_achievements")
        .select("*")
        .order("tier", { ascending: true })
        .order("requirement_count", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's completed achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from("forum_user_achievements")
        .select("*")
        .eq("user_id", userId);

      if (userAchievementsError) throw userAchievementsError;

      // Get user stats for progress calculation
      const { data: userStats, error: userStatsError } = await supabase
        .from("users")
        .select("exp_points, level")
        .eq("id", userId)
        .single();

      if (userStatsError) throw userStatsError;

      // Get thread count
      const { count: threadCount, error: threadError } = await supabase
        .from("forum_threads")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      if (threadError) throw threadError;

      // Get reply count
      const { count: replyCount, error: replyError } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      if (replyError) throw replyError;

      // Get cendol received count
      const { count: cendolReceivedCount, error: cendolReceivedError } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("vote_type", "cendol")
        .or(`thread_id.eq.${threadCount ? threadCount.map(t => t.id).join(",") : ""},reply_id.eq.${replyCount ? replyCount.map(r => r.id).join(",") : ""}`);

      if (cendolReceivedError) throw cendolReceivedError;

      // Get cendol given count
      const { count: cendolGivenCount, error: cendolGivenError } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("vote_type", "cendol");

      if (cendolGivenError) throw cendolGivenError;

      // Process achievements with progress
      const completedAchievementIds = userAchievementsData?.map(a => a.achievement_id) || [];

      const processedAchievements = (achievementsData || []).map(achievement => {
        const userAchievement = userAchievementsData?.find(ua => ua.achievement_id === achievement.id);
        const completed = !!userAchievement;

        let progress = 0;
        let progressPercentage = 0;

        // Calculate progress based on requirement type
        if (!completed) {
          switch (achievement.requirement_type) {
            case "threads":
              progress = threadCount || 0;
              break;
            case "replies":
              progress = replyCount || 0;
              break;
            case "exp":
              progress = userStats?.exp_points || 0;
              break;
            case "level":
              progress = userStats?.level || 1;
              break;
            case "cendol_received":
              progress = cendolReceivedCount || 0;
              break;
            case "cendol_given":
              progress = cendolGivenCount || 0;
              break;
            default:
              progress = 0;
          }

          progressPercentage = Math.min(100, Math.round((progress / achievement.requirement_count) * 100));
        } else {
          progress = achievement.requirement_count;
          progressPercentage = 100;
        }

        return {
          ...achievement,
          completed,
          completed_at: userAchievement?.completed_at,
          progress,
          progress_percentage: progressPercentage
        };
      });

      // Calculate stats
      const totalAchievements = processedAchievements.length;
      const completedCount = processedAchievements.filter(a => a.completed).length;
      const totalExpPossible = processedAchievements.reduce((sum, a) => sum + a.reward_exp, 0);
      const earnedExp = processedAchievements
        .filter(a => a.completed)
        .reduce((sum, a) => sum + a.reward_exp, 0);
      const completionPercentage = totalAchievements > 0
        ? Math.round((completedCount / totalAchievements) * 100)
        : 0;

      setAchievements(processedAchievements);
      setCompletedAchievements(processedAchievements.filter(a => a.completed));
      setInProgressAchievements(processedAchievements.filter(a => !a.completed));
      setStats({
        totalAchievements,
        completedAchievements: completedCount,
        totalExp: totalExpPossible,
        earnedExp,
        completionPercentage
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (achievement: Achievement) => {
    // If achievement has an emoji icon, use it
    if (achievement.icon && achievement.icon.length <= 2) {
      return <span className="text-xl">{achievement.icon}</span>;
    }

    // Otherwise use a default icon
    return <Trophy className="h-5 w-5" />;
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return <Badge variant="outline" className="bg-gray-100">Bronze</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-gray-200">Silver</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-amber-100">Gold</Badge>;
      case 4:
        return <Badge variant="outline" className="bg-blue-100">Platinum</Badge>;
      case 5:
        return <Badge variant="outline" className="bg-purple-100">Diamond</Badge>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "content":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Content</Badge>;
      case "community":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Community</Badge>;
      case "reputation":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Reputation</Badge>;
      case "special":
        return <Badge variant="outline" className="bg-pink-100 text-pink-800">Special</Badge>;
      default:
        return null;
    }
  };

  const getRequirementText = (achievement: Achievement) => {
    switch (achievement.requirement_type) {
      case "threads":
        return `Create ${achievement.requirement_count} thread${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "replies":
        return `Post ${achievement.requirement_count} repl${achievement.requirement_count !== 1 ? 'ies' : 'y'}`;
      case "votes":
        return `Receive ${achievement.requirement_count} vote${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "exp":
        return `Earn ${achievement.requirement_count} experience points`;
      case "level":
        return `Reach level ${achievement.requirement_count}`;
      case "cendol_received":
        return `Receive ${achievement.requirement_count} cendol${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "cendol_given":
        return `Give ${achievement.requirement_count} cendol${achievement.requirement_count !== 1 ? 's' : ''} to others`;
      case "special":
        return "Complete a special challenge";
      default:
        return "Complete the requirements";
    }
  };

  const openAchievementDetails = (achievement: UserAchievement) => {
    setSelectedAchievement(achievement);
    setIsDialogOpen(true);
  };

  const getFilteredAchievements = (achievementList: UserAchievement[]) => {
    return achievementList.filter(achievement => {
      // Filter by category
      if (categoryFilter !== "all" && achievement.category !== categoryFilter) {
        return false;
      }

      // Filter by tier
      if (tierFilter !== "all" && achievement.tier !== parseInt(tierFilter)) {
        return false;
      }

      return true;
    });
  };

  const filteredCompleted = getFilteredAchievements(completedAchievements);
  const filteredInProgress = getFilteredAchievements(inProgressAchievements);

  if (loading) {
    return (
      <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading achievements..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Achievements
          </div>
          <div className="flex items-center text-sm font-normal">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            {stats.earnedExp} XP Earned
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {stats.completedAchievements} / {stats.totalAchievements} Completed
            </Badge>
            <Progress value={stats.completionPercentage} className="w-24" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-xs h-8"
          >
            <Filter className="h-3 w-3" />
            Filters
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-md">
            <div>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="reputation">Reputation</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={tierFilter}
                onValueChange={setTierFilter}
              >
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="1">Bronze</SelectItem>
                  <SelectItem value="2">Silver</SelectItem>
                  <SelectItem value="3">Gold</SelectItem>
                  <SelectItem value="4">Platinum</SelectItem>
                  <SelectItem value="5">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Tabs defaultValue="completed" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="completed">
              Completed ({filteredCompleted.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({filteredInProgress.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-4">
            {filteredCompleted.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCompleted.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openAchievementDetails(achievement)}
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${achievement.color || 'bg-gray-100'}`}
                    >
                      {getAchievementIcon(achievement)}
                    </div>
                    <p className="text-sm font-medium text-center">{achievement.title}</p>
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {getTierLabel(achievement.tier)}
                    </div>
                    <div className="mt-2 text-xs text-amber-600 flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {achievement.reward_exp} XP
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No achievements completed yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Participate in the community to earn achievements!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {filteredInProgress.length > 0 ? (
              <div className="space-y-3">
                {filteredInProgress.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openAchievementDetails(achievement)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${achievement.color || 'bg-gray-100'}`}
                      >
                        {getAchievementIcon(achievement)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{achievement.title}</p>
                          <div className="flex items-center gap-1">
                            {getTierLabel(achievement.tier)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{getRequirementText(achievement)}</span>
                            <span>{achievement.progress || 0} / {achievement.requirement_count}</span>
                          </div>
                          <Progress value={achievement.progress_percentage} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-green-300 mb-2" />
                <p className="text-gray-500">You've completed all achievements!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Congratulations on your accomplishments!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Achievement Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {selectedAchievement && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${
                      selectedAchievement.completed
                        ? selectedAchievement.color || 'bg-gray-100'
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {getAchievementIcon(selectedAchievement)}
                  </div>
                  {selectedAchievement.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedAchievement.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {getTierLabel(selectedAchievement.tier)}
                  {getCategoryLabel(selectedAchievement.category)}
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">How to Earn</h4>
                  <p className="text-sm text-gray-600">
                    {getRequirementText(selectedAchievement)}
                  </p>
                </div>

                <div className="bg-amber-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-amber-700 mb-2">Reward</h4>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-500" />
                    <span className="text-sm text-amber-600">{selectedAchievement.reward_exp} XP</span>
                  </div>
                </div>

                {selectedAchievement.completed ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-green-700 mb-2">Achievement Completed!</h4>
                      <p className="text-sm text-green-600">
                        You completed this achievement on {new Date(selectedAchievement.completed_at || "").toLocaleDateString()}.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <ShareAchievement
                        title={`I earned the ${selectedAchievement.title} achievement on Sensasiwangi!`}
                        description={selectedAchievement.description}
                        shareUrl={`${window.location.origin}/share/achievement/${selectedAchievement.id}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium mb-1">Progress</h4>
                    <div className="flex justify-between text-sm">
                      <span>{selectedAchievement.progress || 0} / {selectedAchievement.requirement_count}</span>
                      <span>{selectedAchievement.progress_percentage}% Complete</span>
                    </div>
                    <Progress value={selectedAchievement.progress_percentage} />
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
