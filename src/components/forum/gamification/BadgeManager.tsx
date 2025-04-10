import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Award, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  Clock,
  Calendar,
  Trophy,
  Lock,
  CheckCircle,
  Info
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

interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: "threads" | "replies" | "votes" | "exp" | "level" | "cendol_received" | "cendol_given" | "special";
  requirement_count: number;
  created_at: string;
  tier?: number;
  category?: string;
  is_secret?: boolean;
  is_limited_time?: boolean;
  end_date?: string;
}

interface UserBadge extends ForumBadge {
  awarded_at: string;
  progress?: number;
  progress_percentage?: number;
}

interface BadgeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export default function BadgeManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [allBadges, setAllBadges] = useState<ForumBadge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [inProgressBadges, setInProgressBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const badgeCategories: BadgeCategory[] = [
    { id: "all", name: "All Badges", icon: <Award className="h-4 w-4" /> },
    { id: "threads", name: "Content Creation", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "replies", name: "Community Support", icon: <Users className="h-4 w-4" /> },
    { id: "votes", name: "Recognition", icon: <ThumbsUp className="h-4 w-4" /> },
    { id: "exp", name: "Experience", icon: <Star className="h-4 w-4" /> },
    { id: "special", name: "Special", icon: <Trophy className="h-4 w-4" /> },
  ];
  
  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);
  
  const fetchBadges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all available badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("forum_badges")
        .select("*")
        .order("requirement_count", { ascending: true });
      
      if (badgesError) throw badgesError;
      
      // Fetch user's earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from("forum_user_badges")
        .select(`
          id,
          user_id,
          badge_id,
          awarded_at,
          badge:badge_id(*)
        `)
        .eq("user_id", user.id);
      
      if (userBadgesError) throw userBadgesError;
      
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
      
      // Process user badges
      const earnedBadges = userBadgesData?.map(item => ({
        ...item.badge,
        awarded_at: item.awarded_at
      })) || [];
      
      // Process badges in progress
      const earnedBadgeIds = earnedBadges.map(badge => badge.id);
      const badgesInProgress = badgesData
        ?.filter(badge => !earnedBadgeIds.includes(badge.id))
        .map(badge => {
          let progress = 0;
          let progressPercentage = 0;
          
          // Calculate progress based on requirement type
          switch (badge.requirement_type) {
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
          
          progressPercentage = Math.min(100, Math.round((progress / badge.requirement_count) * 100));
          
          return {
            ...badge,
            progress,
            progress_percentage: progressPercentage,
            awarded_at: null
          };
        }) || [];
      
      setAllBadges(badgesData || []);
      setUserBadges(earnedBadges);
      setInProgressBadges(badgesInProgress);
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast({
        title: "Error",
        description: "Failed to load badges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getBadgeIcon = (badge: ForumBadge) => {
    // If badge has an emoji icon, use it
    if (badge.icon && badge.icon.length <= 2) {
      return <span className="text-2xl">{badge.icon}</span>;
    }
    
    // Otherwise use an icon based on requirement type
    switch (badge.requirement_type) {
      case "threads":
        return <MessageSquare className="h-6 w-6" />;
      case "replies":
        return <Users className="h-6 w-6" />;
      case "votes":
      case "cendol_received":
      case "cendol_given":
        return <ThumbsUp className="h-6 w-6" />;
      case "exp":
        return <Star className="h-6 w-6" />;
      case "level":
        return <Trophy className="h-6 w-6" />;
      case "special":
        return <Award className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };
  
  const getRequirementText = (badge: ForumBadge) => {
    switch (badge.requirement_type) {
      case "threads":
        return `Create ${badge.requirement_count} thread${badge.requirement_count !== 1 ? 's' : ''}`;
      case "replies":
        return `Post ${badge.requirement_count} repl${badge.requirement_count !== 1 ? 'ies' : 'y'}`;
      case "votes":
        return `Receive ${badge.requirement_count} vote${badge.requirement_count !== 1 ? 's' : ''}`;
      case "exp":
        return `Earn ${badge.requirement_count} experience points`;
      case "level":
        return `Reach level ${badge.requirement_count}`;
      case "cendol_received":
        return `Receive ${badge.requirement_count} cendol${badge.requirement_count !== 1 ? 's' : ''}`;
      case "cendol_given":
        return `Give ${badge.requirement_count} cendol${badge.requirement_count !== 1 ? 's' : ''} to others`;
      case "special":
        return "Complete a special challenge";
      default:
        return "Complete the requirements";
    }
  };
  
  const handleBadgeClick = (badge: UserBadge) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };
  
  const filterBadgesByCategory = (badges: UserBadge[], category: string) => {
    if (category === "all") return badges;
    
    return badges.filter(badge => {
      if (category === "threads" && badge.requirement_type === "threads") return true;
      if (category === "replies" && badge.requirement_type === "replies") return true;
      if (category === "votes" && ["votes", "cendol_received", "cendol_given"].includes(badge.requirement_type)) return true;
      if (category === "exp" && ["exp", "level"].includes(badge.requirement_type)) return true;
      if (category === "special" && badge.requirement_type === "special") return true;
      return false;
    });
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
          <Award className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Badge Collection
            </h1>
            <p className="text-gray-500 mt-1">
              Earn badges by participating in the community
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center">
            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
            {userBadges.length} / {allBadges.length} Badges Earned
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {badgeCategories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
              {category.icon}
              <span className="ml-1">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="space-y-6">
          {/* Earned Badges */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Earned Badges ({filterBadgesByCategory(userBadges, activeCategory).length})</h2>
            {filterBadgesByCategory(userBadges, activeCategory).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">You haven't earned any badges in this category yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filterBadgesByCategory(userBadges, activeCategory).map(badge => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card 
                          className={`cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${badge.color}`}
                          onClick={() => handleBadgeClick(badge)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex justify-center mb-2">
                              {badge.icon ? (
                                <div className="text-3xl">{badge.icon}</div>
                              ) : (
                                getBadgeIcon(badge)
                              )}
                            </div>
                            <h3 className="font-medium text-sm line-clamp-1">{badge.name}</h3>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(badge.awarded_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
          
          {/* Badges in Progress */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Badges in Progress ({filterBadgesByCategory(inProgressBadges, activeCategory).length})</h2>
            {filterBadgesByCategory(inProgressBadges, activeCategory).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">No badges in progress for this category.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterBadgesByCategory(inProgressBadges, activeCategory)
                  .filter(badge => !badge.is_secret)
                  .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
                  .map(badge => (
                    <Card 
                      key={badge.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                      onClick={() => handleBadgeClick(badge)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${badge.color || 'bg-gray-100'}`}>
                            {badge.icon ? (
                              <span className="text-xl">{badge.icon}</span>
                            ) : (
                              getBadgeIcon(badge)
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">{badge.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{badge.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{getRequirementText(badge)}</span>
                            <span>{badge.progress || 0} / {badge.requirement_count}</span>
                          </div>
                          <Progress value={badge.progress_percentage} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                {/* Secret Badges */}
                {filterBadgesByCategory(inProgressBadges, activeCategory)
                  .filter(badge => badge.is_secret)
                  .map(badge => (
                    <Card 
                      key={badge.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden bg-gray-50"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gray-200">
                            <Lock className="h-6 w-6 text-gray-500" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">Secret Badge</h3>
                            <p className="text-sm text-gray-500">Complete special actions to unlock this badge</p>
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
      
      {/* Badge Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Badge Details</DialogTitle>
            <DialogDescription>
              Learn more about this badge and how to earn it
            </DialogDescription>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${selectedBadge.color || 'bg-gray-100'}`}>
                  {selectedBadge.icon ? (
                    <span className="text-3xl">{selectedBadge.icon}</span>
                  ) : (
                    getBadgeIcon(selectedBadge)
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">{selectedBadge.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedBadge.awarded_at ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                    
                    {selectedBadge.is_limited_time && (
                      <Badge variant="destructive" className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Limited Time
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-600">{selectedBadge.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">How to Earn</h4>
                <p className="text-sm text-gray-600">{getRequirementText(selectedBadge)}</p>
              </div>
              
              {selectedBadge.awarded_at ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Earned On</h4>
                  <p className="text-sm text-gray-600">{new Date(selectedBadge.awarded_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium mb-1">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{selectedBadge.progress || 0} / {selectedBadge.requirement_count}</span>
                      <span>{selectedBadge.progress_percentage}% Complete</span>
                    </div>
                    <Progress value={selectedBadge.progress_percentage} />
                  </div>
                </div>
              )}
              
              {selectedBadge.is_limited_time && selectedBadge.end_date && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Info className="h-4 w-4" />
                  <span>Available until {new Date(selectedBadge.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
