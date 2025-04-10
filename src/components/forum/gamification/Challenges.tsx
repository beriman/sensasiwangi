import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Trophy,
  Calendar,
  Clock,
  CheckCircle,
  Award,
  MessageSquare,
  ThumbsUp,
  Users,
  Star,
  Gift,
  TrendingUp,
  Target
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: "thread" | "reply" | "vote" | "badge" | "exp" | "cendol_received" | "cendol_given" | "special";
  target_count: number;
  current_count?: number;
  reward_exp: number;
  reward_badge_id?: string;
  reward_badge?: {
    name: string;
    icon: string;
    color: string;
  };
  reward_badge_name?: string;
  reward_badge_icon?: string;
  reward_badge_color?: string;
  start_date: string;
  end_date: string;
  is_completed?: boolean;
  progress_percentage?: number;
  difficulty?: "easy" | "medium" | "hard" | "expert";
  category?: "daily" | "weekly" | "monthly" | "seasonal" | "special";
  participants_count?: number;
  is_featured?: boolean;
  completed_at?: string;
  required_level?: number;
  image_url?: string;
  tags?: string[];
  reward_claimed?: boolean;
  reward_claimed_at?: string;
}

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user level for filtering challenges
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("level")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      const userLevel = userData?.level || 1;

      // Get all active challenges that user meets level requirement for
      const { data: challengesData, error: challengesError } = await supabase
        .from("forum_challenges")
        .select(`
          *,
          reward_badge:reward_badge_id(name, icon, color)
        `)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .lte("required_level", userLevel);

      if (challengesError) throw challengesError;

      // Get user progress for these challenges
      const { data: progressData, error: progressError } = await supabase
        .from("forum_user_challenges")
        .select("*")
        .eq("user_id", user.id)
        .in("challenge_id", (challengesData || []).map(c => c.id));

      if (progressError) throw progressError;

      // Get completed challenges
      const { data: completedData, error: completedError } = await supabase
        .from("forum_user_challenges")
        .select(`
          *,
          challenge:challenge_id(
            id,
            title,
            description,
            challenge_type,
            target_count,
            reward_exp,
            reward_badge_id,
            reward_badge:reward_badge_id(name, icon, color),
            reward_badge_name,
            reward_badge_icon,
            reward_badge_color,
            start_date,
            end_date,
            difficulty,
            category,
            participants_count,
            image_url,
            tags
          )
        `)
        .eq("user_id", user.id)
        .eq("is_completed", true);

      if (completedError) throw completedError;

      // Process active challenges with progress
      const processedChallenges = (challengesData || []).map(challenge => {
        const userProgress = (progressData || []).find(p => p.challenge_id === challenge.id);

        // Parse tags if they exist
        let parsedTags = [];
        if (challenge.tags) {
          try {
            parsedTags = typeof challenge.tags === 'string'
              ? JSON.parse(challenge.tags)
              : challenge.tags;
          } catch (e) {
            console.error("Error parsing tags:", e);
          }
        }

        return {
          ...challenge,
          current_count: userProgress?.current_count || 0,
          is_completed: userProgress?.is_completed || false,
          progress_percentage: userProgress
            ? Math.min(100, Math.round((userProgress.current_count / challenge.target_count) * 100))
            : 0,
          reward_claimed: userProgress?.reward_claimed || false,
          reward_claimed_at: userProgress?.reward_claimed_at,
          tags: parsedTags
        };
      });

      // Process completed challenges
      const processedCompleted = (completedData || []).map(item => {
        // Parse tags if they exist
        let parsedTags = [];
        if (item.challenge.tags) {
          try {
            parsedTags = typeof item.challenge.tags === 'string'
              ? JSON.parse(item.challenge.tags)
              : item.challenge.tags;
          } catch (e) {
            console.error("Error parsing tags:", e);
          }
        }

        return {
          ...item.challenge,
          is_completed: true,
          progress_percentage: 100,
          completed_at: item.completed_at,
          reward_claimed: item.reward_claimed || false,
          reward_claimed_at: item.reward_claimed_at,
          tags: parsedTags
        };
      });

      // Sort challenges by category and difficulty
      const categoryOrder = { daily: 1, weekly: 2, monthly: 3, seasonal: 4, special: 5 };
      const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };

      const sortedActiveChallenges = processedChallenges
        .filter(c => !c.is_completed)
        .sort((a, b) => {
          // First sort by category
          const categoryDiff = (categoryOrder[a.category as keyof typeof categoryOrder] || 99) -
                             (categoryOrder[b.category as keyof typeof categoryOrder] || 99);
          if (categoryDiff !== 0) return categoryDiff;

          // Then by difficulty
          const difficultyDiff = (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 99) -
                               (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 99);
          if (difficultyDiff !== 0) return difficultyDiff;

          // Finally by progress (higher progress first)
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        });

      // Sort completed challenges by completion date (newest first)
      const sortedCompletedChallenges = processedCompleted
        .sort((a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime());

      setChallenges([...sortedActiveChallenges, ...sortedCompletedChallenges]);
      setActiveChallenges(sortedActiveChallenges);
      setCompletedChallenges(sortedCompletedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "thread":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "reply":
        return <Users className="h-5 w-5 text-green-500" />;
      case "vote":
        return <ThumbsUp className="h-5 w-5 text-purple-500" />;
      case "badge":
        return <Award className="h-5 w-5 text-red-500" />;
      case "exp":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "cendol_received":
        return <ThumbsUp className="h-5 w-5 text-amber-500" />;
      case "cendol_given":
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case "special":
        return <Gift className="h-5 w-5 text-pink-500" />;
      default:
        return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case "thread":
        return "Thread Creation";
      case "reply":
        return "Community Replies";
      case "vote":
        return "Upvotes";
      case "badge":
        return "Badge Collection";
      case "exp":
        return "Experience Points";
      case "cendol_received":
        return "Cendol Received";
      case "cendol_given":
        return "Cendol Given";
      case "special":
        return "Special Event";
      default:
        return "Challenge";
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Easy</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Medium</Badge>;
      case "hard":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Hard</Badge>;
      case "expert":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Expert</Badge>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "daily":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Daily</Badge>;
      case "weekly":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Weekly</Badge>;
      case "monthly":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Monthly</Badge>;
      case "seasonal":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Seasonal</Badge>;
      case "special":
        return <Badge variant="outline" className="bg-pink-100 text-pink-800">Special</Badge>;
      default:
        return null;
    }
  };

  const handleClaimReward = async (challengeId: string) => {
    if (!user) return;

    try {
      // Update the user_challenge record to mark reward as claimed
      const { error } = await supabase
        .from("forum_user_challenges")
        .update({
          reward_claimed: true,
          reward_claimed_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (error) throw error;

      // Update local state
      setCompletedChallenges(completedChallenges.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            reward_claimed: true,
            reward_claimed_at: new Date().toISOString()
          };
        }
        return challenge;
      }));

      toast({
        title: "Reward Claimed",
        description: "You have successfully claimed your reward!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();

    if (diffTime <= 0) return "Expired";

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    }
  };

  if (loading && challenges.length === 0 && completedChallenges.length === 0) {
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
          <Target className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Community Challenges
            </h1>
            <p className="text-gray-500 mt-1">
              Complete challenges to earn rewards and recognition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={(value) => setActiveTab(value as "active" | "completed")}>
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Active Challenges
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500">No active challenges at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges
                .filter(challenge => categoryFilter === "all" || challenge.category === categoryFilter)
                .map((challenge) => (
                <Card key={challenge.id} className={`overflow-hidden ${challenge.is_featured ? 'border-primary border-2' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="mb-2">
                          {getChallengeIcon(challenge.challenge_type)}
                          <span className="ml-1">{getChallengeTypeLabel(challenge.challenge_type)}</span>
                        </Badge>

                        {challenge.difficulty && getDifficultyLabel(challenge.difficulty)}
                        {challenge.category && getCategoryLabel(challenge.category)}

                        {challenge.is_featured && (
                          <Badge variant="default" className="bg-primary">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <Badge variant={
                        challenge.progress_percentage === 100 ? "success" :
                        challenge.progress_percentage >= 50 ? "secondary" : "outline"
                      }>
                        {challenge.progress_percentage}% Complete
                      </Badge>
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>

                    {challenge.tags && challenge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {challenge.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{challenge.current_count} / {challenge.target_count}</span>
                        </div>
                        <Progress value={challenge.progress_percentage} />
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{getTimeRemaining(challenge.end_date)}</span>
                        </div>
                      </div>

                      {challenge.participants_count !== undefined && challenge.participants_count > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{challenge.participants_count} participant{challenge.participants_count !== 1 ? 's' : ''} completed</span>
                        </div>
                      )}

                      {challenge.required_level && challenge.required_level > 1 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Trophy className="h-4 w-4 mr-1" />
                          <span>Requires level {challenge.required_level}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2">
                    <div className="w-full">
                      <div className="text-sm font-medium mb-2">Rewards:</div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-500" />
                          {challenge.reward_exp} XP
                        </Badge>

                        {(challenge.reward_badge || challenge.reward_badge_name) && (
                          <Badge variant="outline" className="flex items-center">
                            <Award className="h-3 w-3 mr-1 text-red-500" />
                            {challenge.reward_badge?.name || challenge.reward_badge_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500">You haven't completed any challenges yet. Start participating to earn rewards!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedChallenges
                .filter(challenge => categoryFilter === "all" || challenge.category === categoryFilter)
                .map((challenge) => (
                <Card key={challenge.id} className={`overflow-hidden bg-gray-50 ${challenge.is_featured ? 'border-primary border-2' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="mb-2">
                          {getChallengeIcon(challenge.challenge_type)}
                          <span className="ml-1">{getChallengeTypeLabel(challenge.challenge_type)}</span>
                        </Badge>

                        {challenge.difficulty && getDifficultyLabel(challenge.difficulty)}
                        {challenge.category && getCategoryLabel(challenge.category)}
                      </div>

                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>

                    {challenge.tags && challenge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {challenge.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                          <span>Completed on {new Date(challenge.completed_at || "").toLocaleDateString()}</span>
                        </div>

                        {challenge.participants_count !== undefined && challenge.participants_count > 0 && (
                          <div className="flex items-center mt-1">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{challenge.participants_count} participant{challenge.participants_count !== 1 ? 's' : ''} completed</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-1">Rewards Earned:</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            {challenge.reward_exp} XP
                          </Badge>

                          {(challenge.reward_badge || challenge.reward_badge_name) && (
                            <Badge variant="outline" className="flex items-center">
                              <Award className="h-3 w-3 mr-1 text-red-500" />
                              {challenge.reward_badge?.name || challenge.reward_badge_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {!challenge.reward_claimed && (
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleClaimReward(challenge.id)}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim Reward
                      </Button>
                    </CardFooter>
                  )}

                  {challenge.reward_claimed && (
                    <CardFooter>
                      <div className="w-full text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          <span>Reward claimed on {new Date(challenge.reward_claimed_at || "").toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
