import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Zap, Trophy, Star, TrendingUp } from "lucide-react";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateLevelProgress } from "../../lib/reputation";

interface ExpCardProps {
  userId: string;
  className?: string;
}

interface UserExpData {
  exp: number;
  level: number;
  rank: number | null;
  totalUsers: number;
}

function ExpCard({ userId, className = "" }: ExpCardProps) {
  const { user } = useAuth();
  const [expData, setExpData] = useState<UserExpData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpData = async () => {
      try {
        setLoading(true);

        // Get user exp
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("exp")
          .eq("id", userId)
          .single();

        if (userError) throw userError;

        // Get user rank
        const { data: rankData, error: rankError } = await supabase
          .from("users")
          .select("id")
          .order("exp", { ascending: false });

        if (rankError) throw rankError;

        const userRank = rankData.findIndex((item) => item.id === userId) + 1;
        const totalUsers = rankData.length;

        setExpData({
          exp: userData.exp || 0,
          level: calculateLevelProgress(userData.exp || 0).currentLevel.level,
          rank: userRank > 0 ? userRank : null,
          totalUsers,
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
      <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-purple-500" />
            Experience Points
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner text="Loading experience data..." />
        </CardContent>
      </Card>
    );
  }

  if (!expData) return null;

  const { progress, currentLevel, nextLevel, expToNextLevel } = calculateLevelProgress(expData.exp);

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-900 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-purple-500" />
          Experience Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Level and Rank Display */}
          <div className="flex justify-between items-center">
            <div>
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                <Zap className="h-3 w-3 mr-1" />
                Level {expData.level}: {currentLevel.title}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">{currentLevel.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{expData.exp}</div>
              <div className="text-xs text-gray-500">Total EXP</div>
            </div>
          </div>

          {/* Rank Display */}
          {expData.rank && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                  <div>
                    <div className="font-medium">Community Rank</div>
                    <div className="text-xs text-gray-500">Based on experience points</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-amber-600">#{expData.rank}</div>
                  <div className="text-xs text-gray-500">of {expData.totalUsers} users</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress to Next Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {nextLevel ? `Progress to Level ${nextLevel.level}` : "Max Level"}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-3 bg-gray-100"
              style={{
                background: "linear-gradient(to right, #e9d5ff 0%, #e9d5ff 30%, #f3f4f6 30%, #f3f4f6 100%)",
              }}
            />
            {nextLevel && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Current: Level {currentLevel.level}</span>
                <span>{expToNextLevel} EXP needed</span>
                <span>Next: Level {nextLevel.level}</span>
              </div>
            )}
          </div>

          {/* Level Benefits */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current Level Benefits</h3>
            <div className="grid grid-cols-1 gap-2">
              {currentLevel.privileges.map((privilege, index) => (
                <div key={index} className="flex items-center bg-purple-50 p-2 rounded-md">
                  <Star className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-sm">{privilege}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn EXP */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              How to Earn EXP
            </h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Create new threads (+10 EXP)</li>
              <li>Post replies to threads (+5 EXP)</li>
              <li>Receive upvotes on your content (+2 EXP each)</li>
              <li>Complete your profile (+20 EXP)</li>
              <li>Daily login bonus (+1 EXP)</li>
              <li>Participate in marketplace activities (+5 EXP)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ExpCard };
export default ExpCard;
