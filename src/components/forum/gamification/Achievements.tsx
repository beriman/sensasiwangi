import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Trophy, 
  Award, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  Clock,
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  Gift,
  Sparkles,
  Medal,
  Crown
} from "lucide-react";
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
  tier: 1 | 2 | 3 | 4 | 5;
  requirement_type: "threads" | "replies" | "votes" | "exp" | "level" | "cendol_received" | "cendol_given" | "special";
  requirement_count: number;
  reward_exp: number;
  reward_badge_id?: string;
  created_at: string;
}

interface UserAchievement extends Achievement {
  completed: boolean;
  completed_at?: string;
  progress?: number;
  progress_percentage?: number;
}

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [completedAchievements, setCompletedAchievements] = useState<UserAchievement[]>([]);
  const [inProgressAchievements, setInProgressAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    totalExp: 0,
    earnedExp: 0,
    completionPercentage: 0
  });
  
  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);
  
  const fetchAchievements = async () => {
    if (!user) return;
    
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
        .eq("user_id", user.id);
      
      if (userAchievementsError) throw userAchievementsError;
      
      // Get user stats for progress calculation
      const { data: userStats, error: userStatsError } = await supabase
        .from("users")
        .select("exp_points, level")
        .eq("id", user.id)
        .single();
      
      if (userStatsError) throw userStatsError;
      
      // Get thread count
      const { count: threadCount, error: threadError } = await supabase
        .from("forum_threads")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);
      
      if (threadError) throw threadError;
      
      // Get reply count
      const { count: replyCount, error: replyError } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);
      
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
        .eq("user_id", user.id)
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
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getAchievementIcon = (achievement: Achievement) => {
    // If achievement has an emoji icon, use it
    if (achievement.icon && achievement.icon.length <= 2) {
      return <span className="text-2xl">{achievement.icon}</span>;
    }
    
    // Otherwise use an icon based on category and tier
    switch (achievement.category) {
      case "content":
        return <MessageSquare className="h-6 w-6" />;
      case "community":
        return <Users className="h-6 w-6" />;
      case "reputation":
        return <ThumbsUp className="h-6 w-6" />;
      case "special":
        return <Sparkles className="h-6 w-6" />;
      default:
        return <Trophy className="h-6 w-6" />;
    }
  };
  
  const getTierIcon = (tier: number) => {
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
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case "content":
        return "Content Creation";
      case "community":
        return "Community Support";
      case "reputation":
        return "Reputation & Recognition";
      case "special":
        return "Special Achievements";
      default:
        return "Achievements";
    }
  };
  
  const handleAchievementClick = (achievement: UserAchievement) => {
    setSelectedAchievement(achievement);
    setIsDialogOpen(true);
  };
  
  const filterAchievementsByCategory = (achievements: UserAchievement[], category: string) => {
    if (category === "all") return achievements;
    return achievements.filter(a => a.category === category);
  };
  
  if (loading) {
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
              Achievements
            </h1>
            <p className="text-gray-500 mt-1">
              Track your progress and earn rewards
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            {stats.completedAchievements} / {stats.totalAchievements} Completed
          </Badge>
          
          <Badge variant="outline" className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            {stats.earnedExp} XP Earned
          </Badge>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion</p>
                <h3 className="text-2xl font-bold mt-1">{stats.completionPercentage}%</h3>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <Progress value={stats.completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Achievements</p>
                <h3 className="text-2xl font-bold mt-1">{stats.completedAchievements}</h3>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Out of {stats.totalAchievements} total achievements
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">XP Earned</p>
                <h3 className="text-2xl font-bold mt-1">{stats.earnedExp}</h3>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Out of {stats.totalExp} possible XP
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Next Achievement</p>
                <h3 className="text-lg font-bold mt-1 truncate max-w-[150px]">
                  {inProgressAchievements.length > 0 
                    ? inProgressAchievements
                        .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))[0]?.title
                    : "All Complete!"}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            {inProgressAchievements.length > 0 && (
              <Progress 
                value={inProgressAchievements
                  .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))[0]?.progress_percentage} 
                className="mt-2" 
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center">
            <Trophy className="h-4 w-4 mr-1" />
            All
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Community
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" />
            Reputation
          </TabsTrigger>
          <TabsTrigger value="special" className="flex items-center">
            <Sparkles className="h-4 w-4 mr-1" />
            Special
          </TabsTrigger>
        </TabsList>
        
        <div className="space-y-6">
          {/* In Progress Achievements */}
          <div>
            <h2 className="text-lg font-semibold mb-3">In Progress ({filterAchievementsByCategory(inProgressAchievements, activeCategory).length})</h2>
            {filterAchievementsByCategory(inProgressAchievements, activeCategory).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">No achievements in progress for this category.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterAchievementsByCategory(inProgressAchievements, activeCategory)
                  .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
                  .map(achievement => (
                    <Card 
                      key={achievement.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                      onClick={() => handleAchievementClick(achievement)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${achievement.color || 'bg-gray-100'}`}>
                            {achievement.icon ? (
                              <span className="text-xl">{achievement.icon}</span>
                            ) : (
                              getAchievementIcon(achievement)
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{achievement.title}</h3>
                              {getTierIcon(achievement.tier)}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1">{achievement.description}</p>
                          </div>
                          
                          <div className="text-right">
                            <Badge variant="outline" className="flex items-center">
                              <Star className="h-3 w-3 mr-1 text-yellow-500" />
                              {achievement.reward_exp} XP
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{getRequirementText(achievement)}</span>
                            <span>{achievement.progress || 0} / {achievement.requirement_count}</span>
                          </div>
                          <Progress value={achievement.progress_percentage} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
          
          {/* Completed Achievements */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Completed ({filterAchievementsByCategory(completedAchievements, activeCategory).length})</h2>
            {filterAchievementsByCategory(completedAchievements, activeCategory).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">No completed achievements in this category yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterAchievementsByCategory(completedAchievements, activeCategory)
                  .sort((a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime())
                  .map(achievement => (
                    <Card 
                      key={achievement.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden bg-gray-50"
                      onClick={() => handleAchievementClick(achievement)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${achievement.color || 'bg-gray-100'}`}>
                            {achievement.icon ? (
                              <span className="text-xl">{achievement.icon}</span>
                            ) : (
                              getAchievementIcon(achievement)
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{achievement.title}</h3>
                              {getTierIcon(achievement.tier)}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1">{achievement.description}</p>
                          </div>
                          
                          <Badge variant="success" className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Completed on {new Date(achievement.completed_at || "").toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Tabs>
      
      {/* Achievement Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Achievement Details</DialogTitle>
            <DialogDescription>
              Learn more about this achievement and how to earn it
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${selectedAchievement.color || 'bg-gray-100'}`}>
                  {selectedAchievement.icon ? (
                    <span className="text-3xl">{selectedAchievement.icon}</span>
                  ) : (
                    getAchievementIcon(selectedAchievement)
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedAchievement.title}</h3>
                    {getTierIcon(selectedAchievement.tier)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {getCategoryName(selectedAchievement.category)}
                    </Badge>
                    
                    {selectedAchievement.completed ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-600">{selectedAchievement.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">How to Earn</h4>
                <p className="text-sm text-gray-600">{getRequirementText(selectedAchievement)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Rewards</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {selectedAchievement.reward_exp} XP
                  </Badge>
                  
                  {selectedAchievement.reward_badge_id && (
                    <Badge variant="outline" className="flex items-center">
                      <Award className="h-3 w-3 mr-1 text-red-500" />
                      Special Badge
                    </Badge>
                  )}
                </div>
              </div>
              
              {selectedAchievement.completed ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Completed On</h4>
                  <p className="text-sm text-gray-600">{new Date(selectedAchievement.completed_at || "").toLocaleDateString()}</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium mb-1">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{selectedAchievement.progress || 0} / {selectedAchievement.requirement_count}</span>
                      <span>{selectedAchievement.progress_percentage}% Complete</span>
                    </div>
                    <Progress value={selectedAchievement.progress_percentage} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
