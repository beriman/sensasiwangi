import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Trophy, Award, Star, ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MainLayout from "../layout/MainLayout";

interface SharedAchievementParams {
  type: string;
  id: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  exp_points: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  tier: number;
  reward_exp: number;
  completed_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: number;
  awarded_at: string;
}

interface LeaderboardRank {
  rank: number;
  score: number;
  period: string;
  leaderboard_type: string;
  snapshot_date: string;
}

export default function SharedAchievement() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [leaderboardRank, setLeaderboardRank] = useState<LeaderboardRank | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSharedItem();
  }, [type, id]);
  
  const fetchSharedItem = async () => {
    try {
      setLoading(true);
      
      if (!type || !id) {
        setError("Invalid sharing link");
        return;
      }
      
      switch (type) {
        case "achievement":
          await fetchAchievement(id);
          break;
        case "badge":
          await fetchBadge(id);
          break;
        case "leaderboard":
          await fetchLeaderboardRank(id);
          break;
        default:
          setError("Invalid sharing type");
      }
    } catch (error) {
      console.error("Error fetching shared item:", error);
      setError("Failed to load the shared item");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAchievement = async (achievementId: string) => {
    // Get user achievement
    const { data: userAchievement, error: userAchievementError } = await supabase
      .from("forum_user_achievements")
      .select(`
        user_id,
        completed_at,
        achievement:achievement_id(
          id,
          title,
          description,
          category,
          icon,
          color,
          tier,
          reward_exp
        )
      `)
      .eq("id", achievementId)
      .single();
    
    if (userAchievementError) throw userAchievementError;
    
    if (!userAchievement) {
      setError("Achievement not found");
      return;
    }
    
    // Get user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, level, exp_points")
      .eq("id", userAchievement.user_id)
      .single();
    
    if (userProfileError) throw userProfileError;
    
    setUser(userProfile);
    setAchievement({
      ...userAchievement.achievement,
      completed_at: userAchievement.completed_at
    });
  };
  
  const fetchBadge = async (badgeId: string) => {
    // Get user badge
    const { data: userBadge, error: userBadgeError } = await supabase
      .from("forum_user_badges")
      .select(`
        user_id,
        awarded_at,
        badge:badge_id(
          id,
          name,
          description,
          icon,
          color,
          tier
        )
      `)
      .eq("id", badgeId)
      .single();
    
    if (userBadgeError) throw userBadgeError;
    
    if (!userBadge) {
      setError("Badge not found");
      return;
    }
    
    // Get user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, level, exp_points")
      .eq("id", userBadge.user_id)
      .single();
    
    if (userProfileError) throw userProfileError;
    
    setUser(userProfile);
    setBadge({
      ...userBadge.badge,
      awarded_at: userBadge.awarded_at
    });
  };
  
  const fetchLeaderboardRank = async (rankId: string) => {
    // Get leaderboard rank
    const { data: rankData, error: rankError } = await supabase
      .from("forum_leaderboard_history")
      .select("*")
      .eq("id", rankId)
      .single();
    
    if (rankError) throw rankError;
    
    if (!rankData) {
      setError("Leaderboard rank not found");
      return;
    }
    
    // Get user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, level, exp_points")
      .eq("id", rankData.user_id)
      .single();
    
    if (userProfileError) throw userProfileError;
    
    setUser(userProfile);
    setLeaderboardRank(rankData);
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
  
  const getLeaderboardTypeLabel = (leaderboardType: string) => {
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
  
  const getPeriodLabel = (period: string) => {
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
  
  if (loading) {
    return <LoadingScreen text="Loading shared item..." />;
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-12 text-center">
          <div className="mb-6">
            <Trophy className="h-16 w-16 mx-auto text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <p className="text-gray-500 mb-6">The item you're looking for could not be found or is no longer available.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12">
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              
              <Badge variant="outline">
                Shared Achievement
              </Badge>
            </div>
            
            {user && (
              <div className="flex items-center mb-6">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                    alt={user.username} 
                  />
                  <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Badge variant="outline" className="mr-2">
                      Level {user.level}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {user.exp_points} XP
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {achievement && (
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-full mr-4 ${achievement.color || 'bg-gray-100'}`}
                  >
                    {achievement.icon ? (
                      <span className="text-2xl">{achievement.icon}</span>
                    ) : (
                      <Trophy className="h-8 w-8" />
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold">{achievement.title}</h1>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {getTierLabel(achievement.tier)}
                      {getCategoryLabel(achievement.category)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{achievement.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-amber-600">
                    <Star className="h-4 w-4 mr-1" />
                    Reward: {achievement.reward_exp} XP
                  </div>
                  
                  <div className="text-gray-500">
                    Completed on {new Date(achievement.completed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            {badge && (
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-full mr-4 ${badge.color || 'bg-gray-100'}`}
                  >
                    {badge.icon ? (
                      <span className="text-2xl">{badge.icon}</span>
                    ) : (
                      <Award className="h-8 w-8" />
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold">{badge.name}</h1>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {getTierLabel(badge.tier)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{badge.description}</p>
                
                <div className="text-sm text-gray-500 text-right">
                  Awarded on {new Date(badge.awarded_at).toLocaleDateString()}
                </div>
              </div>
            )}
            
            {leaderboardRank && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-4">
                    <Trophy className="h-8 w-8" />
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold">
                      Rank #{leaderboardRank.rank}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {getPeriodLabel(leaderboardRank.period)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {getLeaderboardTypeLabel(leaderboardRank.leaderboard_type)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-blue-500" />
                    Score: {leaderboardRank.score} {getLeaderboardTypeLabel(leaderboardRank.leaderboard_type)}
                  </div>
                  
                  <div className="text-gray-500">
                    Achieved on {new Date(leaderboardRank.snapshot_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Shared from Sensasiwangi.id
            </div>
            
            <Link to="/">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Sensasiwangi
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
