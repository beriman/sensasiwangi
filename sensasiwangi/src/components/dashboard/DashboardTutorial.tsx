// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  TooltipTutorial,
  TutorialStep,
} from "../../components/ui/tooltip-tutorial";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { hasTutorialBeenSeen, markTutorialAsSeen } from "../../lib/rewards";

export default function DashboardTutorial() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const seen = await hasTutorialBeenSeen(user.id);
        setShowTutorial(!seen);
      } catch (error) {
        console.error("Error checking tutorial status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user]);

  const handleCompleteTutorial = async () => {
    if (!user) return;

    try {
      await markTutorialAsSeen(user.id);
      setShowTutorial(false);
    } catch (error) {
      console.error("Error marking tutorial as seen:", error);
    }
  };

  const handleDismissTutorial = async () => {
    if (!user) return;

    try {
      await markTutorialAsSeen(user.id);
      setShowTutorial(false);
    } catch (error) {
      console.error("Error marking tutorial as seen:", error);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      target: ".user-profile-card",
      title: "Your Profile",
      content:
        "This is your profile card. You can see your current level, EXP, and membership status here.",
      position: "right",
    },
    {
      target: ".daily-login-reward",
      title: "Daily Rewards",
      content:
        "Don't forget to claim your daily login reward! You'll earn EXP and build a streak for bonus rewards.",
      position: "bottom",
    },
    {
      target: ".user-exp-card",
      title: "Experience Points",
      content:
        "Track your progress here. Earn EXP by posting in the forum, receiving likes, and logging in daily.",
      position: "left",
    },
    {
      target: ".forum-link",
      title: "Community Forum",
      content:
        "Join discussions with other perfume enthusiasts, share your knowledge, and ask questions.",
      position: "bottom",
    },
    {
      target: ".marketplace-link",
      title: "Marketplace",
      content:
        "Buy and sell perfumes, samples, and related items in our community marketplace.",
      position: "bottom",
    },
    {
      target: ".notification-center",
      title: "Notifications",
      content:
        "Stay updated with replies to your posts, mentions, and other important activities.",
      position: "bottom",
    },
  ];

  if (loading || !showTutorial) return null;

  return (
    <TooltipTutorial
      steps={tutorialSteps}
      isOpen={showTutorial}
      onComplete={handleCompleteTutorial}
      onDismiss={handleDismissTutorial}
    />
  );
}


