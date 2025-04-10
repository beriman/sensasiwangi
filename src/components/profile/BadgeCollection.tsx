import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Award, ChevronRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeCollectionProps {
  userId: string;
  limit?: number;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  acquired_at: string;
}

export default function BadgeCollection({ userId, limit = 8 }: BadgeCollectionProps) {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [totalBadges, setTotalBadges] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchBadges = async () => {
      try {
        setLoading(true);
        
        // Get user badges
        const { data, error } = await supabase
          .from("user_badges")
          .select(`
            badge_id,
            acquired_at,
            badge:badge_id (
              id,
              name,
              description,
              icon,
              color
            )
          `)
          .eq("user_id", userId)
          .order("acquired_at", { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        
        // Get total count
        const { count, error: countError } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        
        if (countError) throw countError;
        
        // Transform data
        const transformedBadges = data?.map(item => ({
          id: item.badge.id,
          name: item.badge.name,
          description: item.badge.description,
          icon: item.badge.icon,
          color: item.badge.color,
          acquired_at: item.acquired_at,
        })) || [];
        
        setBadges(transformedBadges);
        setTotalBadges(count || 0);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, [userId, limit]);

  // Placeholder badges for empty state
  const placeholderBadges = [
    { name: "First Post", icon: "📝", color: "bg-blue-100" },
    { name: "Helpful Answer", icon: "🤝", color: "bg-green-100" },
    { name: "Popular Thread", icon: "🔥", color: "bg-orange-100" },
    { name: "First Sale", icon: "💰", color: "bg-yellow-100" },
    { name: "Community Builder", icon: "👥", color: "bg-purple-100" },
    { name: "Verified Seller", icon: "✅", color: "bg-teal-100" },
    { name: "Top Contributor", icon: "🏆", color: "bg-red-100" },
    { name: "Sambatan Hero", icon: "🦸", color: "bg-indigo-100" },
  ];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            Badge Collection
          </div>
          <Link to="/profile?tab=badges">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              View All ({totalBadges})
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`${badge.color || "bg-gray-100"} rounded-lg p-4 flex flex-col items-center justify-center text-center h-24 cursor-help`}>
                      <div className="text-2xl mb-2">{badge.icon || "🏅"}</div>
                      <div className="text-xs font-medium truncate w-full">
                        {badge.name}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 max-w-xs">
                      <p className="font-medium">{badge.name}</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                      <p className="text-xs text-gray-400">
                        Acquired on {new Date(badge.acquired_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-50">
              {placeholderBadges.map((badge, index) => (
                <div
                  key={index}
                  className={`${badge.color} rounded-lg p-4 flex flex-col items-center justify-center text-center h-24 relative`}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-medium truncate w-full">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              You haven't earned any badges yet. Participate in the community to unlock them!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
