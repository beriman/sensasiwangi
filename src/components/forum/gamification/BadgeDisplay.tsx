import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Award, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  Lock
} from "lucide-react";

interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_count: number;
  tier?: number;
  category?: string;
  rarity?: string;
  is_secret?: boolean;
  is_limited_time?: boolean;
  awarded_at?: string;
}

interface BadgeDisplayProps {
  badge: ForumBadge;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  onClick?: () => void;
}

export default function BadgeDisplay({ 
  badge, 
  size = "md", 
  showTooltip = true,
  onClick
}: BadgeDisplayProps) {
  const getBadgeIcon = () => {
    // If badge has an emoji icon, use it
    if (badge.icon && badge.icon.length <= 2) {
      return <span className={size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"}>{badge.icon}</span>;
    }
    
    // Otherwise use an icon based on requirement type
    const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";
    
    switch (badge.requirement_type) {
      case "threads":
        return <MessageSquare className={iconSize} />;
      case "replies":
        return <Users className={iconSize} />;
      case "votes":
      case "cendol_received":
      case "cendol_given":
        return <ThumbsUp className={iconSize} />;
      case "exp":
        return <Star className={iconSize} />;
      case "level":
        return <Star className={iconSize} />;
      case "special":
        return <Award className={iconSize} />;
      default:
        return <Award className={iconSize} />;
    }
  };
  
  const getRarityLabel = () => {
    if (!badge.rarity) return null;
    
    switch (badge.rarity) {
      case "common":
        return <span className="text-gray-500 text-xs">Common</span>;
      case "uncommon":
        return <span className="text-green-500 text-xs">Uncommon</span>;
      case "rare":
        return <span className="text-blue-500 text-xs">Rare</span>;
      case "epic":
        return <span className="text-purple-500 text-xs">Epic</span>;
      case "legendary":
        return <span className="text-amber-500 text-xs">Legendary</span>;
      default:
        return null;
    }
  };
  
  const getTierStars = () => {
    if (!badge.tier) return null;
    
    return (
      <div className="flex">
        {Array.from({ length: badge.tier }).map((_, i) => (
          <Star key={i} className="h-3 w-3 text-amber-400" fill="currentColor" />
        ))}
      </div>
    );
  };
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24"
  };
  
  const badgeContent = (
    <div 
      className={`${sizeClasses[size]} rounded-full flex flex-col items-center justify-center ${badge.color || 'bg-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {badge.is_secret && !badge.awarded_at ? (
        <Lock className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"} />
      ) : (
        getBadgeIcon()
      )}
      
      {size === "lg" && (
        <div className="mt-1 text-xs font-medium line-clamp-1 px-1 text-center">
          {badge.is_secret && !badge.awarded_at ? "Secret" : badge.name}
        </div>
      )}
    </div>
  );
  
  if (!showTooltip) {
    return badgeContent;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">
              {badge.is_secret && !badge.awarded_at ? "Secret Badge" : badge.name}
            </div>
            
            {badge.tier && (
              <div className="flex items-center gap-1">
                {getTierStars()}
                {badge.rarity && (
                  <span className="ml-1">{getRarityLabel()}</span>
                )}
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              {badge.is_secret && !badge.awarded_at 
                ? "Complete special actions to unlock this badge" 
                : badge.description}
            </p>
            
            {badge.awarded_at && (
              <div className="text-xs text-green-600 font-medium">
                Earned on {new Date(badge.awarded_at).toLocaleDateString()}
              </div>
            )}
            
            {badge.is_limited_time && (
              <div className="text-xs text-amber-600 font-medium">
                Limited Time Badge
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
