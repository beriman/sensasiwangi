import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Lock, Info, Share2 } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ShareAchievement from "@/components/gamification/ShareAchievement";
import { getUserBadges, getAllBadges } from "@/lib/forum";
import { ForumBadge } from "@/types/forum";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BadgeCollectionProps {
  userId: string;
  className?: string;
}

export default function BadgeCollection({
  userId,
  className = "",
}: BadgeCollectionProps) {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<ForumBadge[]>([]);
  const [allBadges, setAllBadges] = useState<ForumBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<ForumBadge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("earned");

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);

        // Get user badges
        const badges = await getUserBadges(userId);
        setUserBadges(badges);

        // Get all available badges
        const availableBadges = await getAllBadges();
        setAllBadges(availableBadges);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const openBadgeDetails = (badge: ForumBadge) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2 text-purple-500" />
            Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner text="Loading badges..." />
        </CardContent>
      </Card>
    );
  }

  // Get badges that user hasn't earned yet
  const unlockedBadges = userBadges;
  const lockedBadges = allBadges.filter(
    (badge) => !userBadges.some((userBadge) => userBadge.id === badge.id)
  );

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-900 flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-500" />
          Badge Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earned" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="earned">
              Earned Badges ({unlockedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Available Badges ({lockedBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-4">
            {unlockedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openBadgeDetails(badge)}
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${badge.color.split(" ").slice(0, 2).join(" ")}`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                    </div>
                    <p className="text-sm font-medium text-center">{badge.name}</p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {badge.description.length > 50
                        ? `${badge.description.substring(0, 50)}...`
                        : badge.description}
                    </p>
                    <div className="mt-2 text-xs text-purple-600">
                      <Info className="h-3 w-3 inline mr-1" />
                      View Details
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No badges earned yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Participate in the community to earn badges!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            {lockedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => openBadgeDetails(badge)}
                  >
                    <div className="relative">
                      <div
                        className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 bg-gray-200 text-gray-400`}
                      >
                        <span className="text-xl opacity-50">{badge.icon}</span>
                      </div>
                      <div className="absolute top-0 right-0 bg-gray-500 text-white rounded-full p-1">
                        <Lock className="h-3 w-3" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center text-gray-500">{badge.name}</p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      {badge.description.length > 50
                        ? `${badge.description.substring(0, 50)}...`
                        : badge.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <Info className="h-3 w-3 inline mr-1" />
                      View Requirements
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-green-300 mb-2" />
                <p className="text-gray-500">You've earned all available badges!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Congratulations on your achievements!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Badge Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {selectedBadge && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${
                      userBadges.some((b) => b.id === selectedBadge.id)
                        ? selectedBadge.color.split(" ").slice(0, 2).join(" ")
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <span>{selectedBadge.icon}</span>
                  </div>
                  {selectedBadge.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedBadge.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">How to Earn</h4>
                  <p className="text-sm text-gray-600">
                    {selectedBadge.requirements || "Complete specific actions in the community to earn this badge."}
                  </p>
                </div>

                {userBadges.some((b) => b.id === selectedBadge.id) && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-green-700 mb-2">Badge Earned!</h4>
                      <p className="text-sm text-green-600">
                        You've already earned this badge. Keep up the good work!
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <ShareAchievement
                        title={`I earned the ${selectedBadge.name} badge on Sensasiwangi!`}
                        description={selectedBadge.description}
                        shareUrl={`${window.location.origin}/share/badge/${selectedBadge.id}`}
                      />
                    </div>
                  </div>
                )}

                {!userBadges.some((b) => b.id === selectedBadge.id) && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Badge Locked</h4>
                    <p className="text-sm text-blue-600">
                      Complete the requirements to unlock this badge.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
