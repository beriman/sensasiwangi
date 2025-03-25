import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar, Award, Flame } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { recordDailyLogin, getUserLoginStreak } from "@/lib/rewards";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyLoginReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [expAwarded, setExpAwarded] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(7);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { currentStreak, lastLoginDate } = await getUserLoginStreak(
          user.id,
        );

        // Check if already claimed today
        const today = new Date().toISOString().split("T")[0];
        const lastLogin = lastLoginDate ? lastLoginDate.split("T")[0] : null;

        setClaimed(today === lastLogin);
        setStreakCount(currentStreak);

        // Calculate next milestone (7, 30, 365 days)
        let next = 7;
        if (currentStreak >= 7) next = 30;
        if (currentStreak >= 30) next = 365;
        setNextMilestone(next);

        // Calculate progress to next milestone
        const milestoneProgress = ((currentStreak % next) / next) * 100;
        setProgress(milestoneProgress);
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [user]);

  const handleClaimReward = async () => {
    if (!user || claimed || claiming) return;

    try {
      setClaiming(true);
      const {
        expAwarded,
        streakCount: newStreak,
        isNewLogin,
      } = await recordDailyLogin(user.id);

      if (isNewLogin) {
        setExpAwarded(expAwarded);
        setStreakCount(newStreak);
        setClaimed(true);

        // Calculate next milestone
        let next = 7;
        if (newStreak >= 7) next = 30;
        if (newStreak >= 30) next = 365;
        setNextMilestone(next);

        // Calculate progress to next milestone
        const milestoneProgress = ((newStreak % next) / next) * 100;
        setProgress(milestoneProgress);

        toast({
          title: "Daily Reward Claimed!",
          description: `You earned ${expAwarded} EXP. Login streak: ${newStreak} days.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Already Claimed",
          description: "You've already claimed your daily reward today.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      toast({
        title: "Error",
        description: "Failed to claim daily reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Daily Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
          Daily Reward
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {!claimed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4"
              >
                <Button
                  onClick={handleClaimReward}
                  disabled={claiming || claimed}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-5 w-5" />
                      Claim Daily Reward
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100 text-center"
              >
                <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Reward Claimed!</p>
                <p className="text-green-600 text-sm">+{expAwarded} EXP</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Flame className="h-4 w-4 text-orange-500 mr-1" />
                <span className="font-medium">Streak: {streakCount} days</span>
              </div>
              <span className="text-gray-500">
                Next milestone: {nextMilestone} days
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 text-center mt-1">
              {streakCount % 7 === 0 && streakCount > 0 ? (
                <span className="text-purple-600 font-medium">
                  Weekly bonus unlocked! +20 EXP
                </span>
              ) : streakCount % 30 === 0 && streakCount > 0 ? (
                <span className="text-indigo-600 font-medium">
                  Monthly bonus unlocked! +100 EXP
                </span>
              ) : streakCount % 365 === 0 && streakCount > 0 ? (
                <span className="text-amber-600 font-medium">
                  Yearly bonus unlocked! +1000 EXP
                </span>
              ) : (
                `${streakCount % nextMilestone} / ${nextMilestone} days to next bonus`
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
