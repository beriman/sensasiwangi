import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Star, 
  MessageSquare, 
  MessageCircle, 
  ThumbsUp, 
  Award
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeaderboardUser {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  exp: number;
  level: number;
  thread_count: number;
  reply_count: number;
  vote_count: number;
  badge_count: number;
  top_badges?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  rank: number;
}

interface LeaderboardCardProps {
  user: LeaderboardUser;
  highlightCurrentUser?: boolean;
  showRank?: boolean;
  leaderboardType: string;
  onClick?: () => void;
}

export default function LeaderboardCard({ 
  user, 
  highlightCurrentUser = false, 
  showRank = true,
  leaderboardType,
  onClick
}: LeaderboardCardProps) {
  // Get the primary stat based on leaderboard type
  const getPrimaryStat = () => {
    switch (leaderboardType) {
      case "exp":
        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{user.exp.toLocaleString()} XP</span>
          </div>
        );
      case "threads":
        return (
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
            <span>{user.thread_count} Threads</span>
          </div>
        );
      case "replies":
        return (
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-1 text-green-500" />
            <span>{user.reply_count} Replies</span>
          </div>
        );
      case "votes":
        return (
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1 text-amber-500" />
            <span>{user.vote_count} Votes</span>
          </div>
        );
      case "badges":
        return (
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1 text-purple-500" />
            <span>{user.badge_count} Badges</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{user.exp.toLocaleString()} XP</span>
          </div>
        );
    }
  };
  
  // Get rank badge color
  const getRankBadgeColor = () => {
    if (user.rank === 1) return "bg-amber-100 text-amber-800 border-amber-300";
    if (user.rank === 2) return "bg-gray-200 text-gray-800 border-gray-300";
    if (user.rank === 3) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };
  
  // Get rank icon
  const getRankIcon = () => {
    if (user.rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (user.rank === 2) return <Trophy className="h-4 w-4 text-gray-500" />;
    if (user.rank === 3) return <Trophy className="h-4 w-4 text-amber-700" />;
    return null;
  };
  
  return (
    <Card 
      className={`overflow-hidden ${highlightCurrentUser ? 'border-primary border-2' : ''} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {showRank && (
            <div className={`flex items-center justify-center h-8 w-8 rounded-full border ${getRankBadgeColor()}`}>
              {getRankIcon() || <span className="font-bold">{user.rank}</span>}
            </div>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
              alt={user.username} 
            />
            <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{user.username}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Badge variant="outline" className="mr-2">
                Lvl {user.level}
              </Badge>
              {getPrimaryStat()}
            </div>
          </div>
          
          {user.top_badges && user.top_badges.length > 0 && (
            <div className="flex -space-x-2">
              {user.top_badges.map((badge, index) => (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${badge.color || 'bg-gray-100'} border-2 border-white`}
                      >
                        {badge.icon ? (
                          <span className="text-sm">{badge.icon}</span>
                        ) : (
                          <Award className="h-4 w-4" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{badge.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
