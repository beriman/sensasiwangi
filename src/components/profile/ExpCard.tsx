import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateLevelProgress } from "@/lib/reputation";
import { Award, Zap, Trophy, Star, TrendingUp } from "lucide-react";

interface ExpCardProps {
  userId: string;
}

interface UserExpData {
  exp: number;
  level: number;
  rank?: string;
  leaderboard_position?: number;
  recent_activities?: {
    action: string;
    exp_gained: number;
    created_at: string;
  }[];
}

export default function ExpCard({ userId }: ExpCardProps) {
  const [loading, setLoading] = useState(true);
  const [expData, setExpData] = useState<UserExpData>({
    exp: 0,
    level: 1,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchExpData = async () => {
      try {
        setLoading(true);
        
        // Get user exp data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("exp")
          .eq("id", userId)
          .single();
        
        if (userError) throw userError;
        
        const exp = userData?.exp || 0;
        
        // Get recent exp activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("exp_activities")
          .select("action, exp_gained, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (activitiesError) throw activitiesError;
        
        // Get leaderboard position
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from("users")
          .select("id")
          .order("exp", { ascending: false })
          .limit(100);
        
        if (leaderboardError) throw leaderboardError;
        
        let leaderboardPosition = undefined;
        if (leaderboardData) {
          const position = leaderboardData.findIndex(u => u.id === userId);
          if (position !== -1) {
            leaderboardPosition = position + 1;
          }
        }
        
        // Calculate level and rank
        const { currentLevel } = calculateLevelProgress(exp);
        
        let rank = "Newbie";
        if (currentLevel.level >= 50) rank = "Legend";
        else if (currentLevel.level >= 30) rank = "Master";
        else if (currentLevel.level >= 20) rank = "Expert";
        else if (currentLevel.level >= 10) rank = "Enthusiast";
        else if (currentLevel.level >= 5) rank = "Regular";
        
        setExpData({
          exp,
          level: currentLevel.level,
          rank,
          leaderboard_position: leaderboardPosition,
          recent_activities: activitiesData,
        });
      } catch (error) {
        console.error("Error fetching exp data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpData();
  }, [userId]);

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
        <CardContent className="p-6 flex justify-center items-center h-full">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  const { progress, nextLevel, expToNextLevel } = calculateLevelProgress(expData.exp);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold">Experience & Level</h3>
            </div>
            {expData.leaderboard_position && expData.leaderboard_position <= 100 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <Trophy className="h-3 w-3 mr-1 text-amber-500" />
                Rank #{expData.leaderboard_position}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{expData.level}</div>
              <div className="text-sm text-purple-700">Current Level</div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{expData.exp}</div>
              <div className="text-sm text-blue-700">Total XP</div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{expData.rank}</div>
              <div className="text-sm text-green-700">Rank</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Progress to Level {nextLevel.level}</div>
              <div className="text-xs text-gray-500">{expData.exp} / {nextLevel.expRequired} XP</div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Level {expData.level}: {nextLevel.expRequired - expToNextLevel} XP earned</span>
              <span>{expToNextLevel} XP needed for next level</span>
            </div>
          </div>
          
          {expData.recent_activities && expData.recent_activities.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
              </div>
              <div className="space-y-2">
                {expData.recent_activities.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-purple-500 mr-2" />
                      <span>{activity.action}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">+{activity.exp_gained} XP</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
