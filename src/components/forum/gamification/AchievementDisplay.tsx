import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Trophy, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  Lock,
  CheckCircle
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "content" | "community" | "reputation" | "special";
  icon: string;
  color: string;
  tier: 1 | 2 | 3 | 4 | 5;
  requirement_type: string;
  requirement_count: number;
  reward_exp: number;
  reward_badge_id?: string;
  completed?: boolean;
  completed_at?: string;
  progress?: number;
  progress_percentage?: number;
}

interface AchievementDisplayProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
}

export default function AchievementDisplay({ 
  achievement, 
  size = "md", 
  showProgress = true,
  showTooltip = true,
  onClick
}: AchievementDisplayProps) {
  const getAchievementIcon = () => {
    // If achievement has an emoji icon, use it
    if (achievement.icon && achievement.icon.length <= 2) {
      return <span className={size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"}>{achievement.icon}</span>;
    }
    
    // Otherwise use an icon based on category
    const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";
    
    switch (achievement.category) {
      case "content":
        return <MessageSquare className={iconSize} />;
      case "community":
        return <Users className={iconSize} />;
      case "reputation":
        return <ThumbsUp className={iconSize} />;
      case "special":
        return <Trophy className={iconSize} />;
      default:
        return <Trophy className={iconSize} />;
    }
  };
  
  const getTierLabel = () => {
    switch (achievement.tier) {
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
  
  const getCategoryLabel = () => {
    switch (achievement.category) {
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
  
  const getRequirementText = () => {
    switch (achievement.requirement_type) {
      case "threads":
        return `Create ${achievement.requirement_count} thread${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "replies":
        return `Post ${achievement.requirement_count} repl${achievement.requirement_count !== 1 ? 'ies' : 'y'}`;
      case "votes":
      case "cendol_received":
        return `Receive ${achievement.requirement_count} cendol${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "cendol_given":
        return `Give ${achievement.requirement_count} cendol${achievement.requirement_count !== 1 ? 's' : ''}`;
      case "level":
        return `Reach level ${achievement.requirement_count}`;
      case "exp":
        return `Earn ${achievement.requirement_count} experience points`;
      case "special":
        return "Complete a special action or achievement";
      default:
        return "Complete the requirements";
    }
  };
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24"
  };
  
  const achievementContent = (
    <div className="flex flex-col items-center">
      <div 
        className={`${sizeClasses[size]} rounded-full flex flex-col items-center justify-center ${achievement.color || 'bg-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
      >
        {achievement.completed ? (
          <div className="relative">
            {getAchievementIcon()}
            <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
          </div>
        ) : (
          getAchievementIcon()
        )}
      </div>
      
      {size !== "sm" && (
        <div className="mt-2 text-center">
          <div className="font-medium text-sm line-clamp-1">
            {achievement.title}
          </div>
          
          {size === "lg" && (
            <div className="text-xs text-gray-500 mt-1">
              {getTierLabel()}
            </div>
          )}
        </div>
      )}
      
      {showProgress && !achievement.completed && achievement.progress_percentage !== undefined && (
        <div className="w-full mt-2">
          <Progress value={achievement.progress_percentage} className="h-1" />
          <div className="text-xs text-gray-500 text-center mt-1">
            {achievement.progress || 0}/{achievement.requirement_count}
          </div>
        </div>
      )}
    </div>
  );
  
  if (!showTooltip) {
    return achievementContent;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {achievementContent}
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">
              {achievement.title}
            </div>
            
            <div className="flex items-center gap-1">
              {getTierLabel()}
              {getCategoryLabel()}
            </div>
            
            <p className="text-sm text-gray-500">
              {achievement.description}
            </p>
            
            <div className="text-xs font-medium">
              Requirement: {getRequirementText()}
            </div>
            
            {achievement.completed ? (
              <div className="text-xs text-green-600 font-medium">
                Completed on {new Date(achievement.completed_at || "").toLocaleDateString()}
              </div>
            ) : (
              <div className="text-xs text-gray-600">
                Progress: {achievement.progress || 0}/{achievement.requirement_count} ({achievement.progress_percentage || 0}%)
              </div>
            )}
            
            <div className="text-xs text-amber-600 font-medium">
              Reward: {achievement.reward_exp} XP
              {achievement.reward_badge_id && " + Special Badge"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
