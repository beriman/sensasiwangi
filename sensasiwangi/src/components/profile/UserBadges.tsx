// @ts-ignore
import React from "react";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
// @ts-ignore
import { ForumBadge } from "../../types/forum";

interface UserBadgesProps {
  userBadges: ForumBadge[];
  allBadges: ForumBadge[];
  showAll?: boolean;
}

export default function UserBadges({
  userBadges,
  allBadges,
  showAll = false,
}: UserBadgesProps) {
  // Filter out badges the user already has
  const availableBadges = allBadges.filter(
    (badge) => !userBadges.some((userBadge) => userBadge.id === badge.id),
  );

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Badges & Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Your Badges ({userBadges.length})
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {userBadges.length > 0 ? (
                userBadges.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={badge.color}>
                          <span className="mr-1">{badge.icon}</span>
                          {badge.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No badges earned yet. Participate in the forum to earn badges!
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Badges to Unlock ({availableBadges.length})
            </h3>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {availableBadges
                .slice(0, showAll ? availableBadges.length : 3)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50"
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 opacity-50 ${badge.color
                        .split(" ")
                        .slice(0, 2)
                        .join(" ")}`}
                    >
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{badge.name}</p>
                      <p className="text-xs text-gray-500">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}

              {!showAll && availableBadges.length > 3 && (
                <p className="text-xs text-center mt-1 text-gray-500">
                  And {availableBadges.length - 3} more badges to unlock!
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


