// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { TrendingUp, Award, RefreshCw } from "lucide-react";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { getLeaderboard } from "../../lib/forum";

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  exp: number;
  level: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export default function LeaderboardCard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard(timeFrame);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
            <span>Leaderboard</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm">
            <Button
              variant={timeFrame === "week" ? "default" : "outline"}
              size="sm"
              className="rounded-l-md rounded-r-none text-xs"
              onClick={() => setTimeFrame("week")}
            >
              Minggu Ini
            </Button>
            <Button
              variant={timeFrame === "month" ? "default" : "outline"}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setTimeFrame("month")}
            >
              Bulan Ini
            </Button>
            <Button
              variant={timeFrame === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-r-md rounded-l-none text-xs"
              onClick={() => setTimeFrame("all")}
            >
              Sepanjang Masa
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Belum ada data leaderboard
              </div>
            ) : (
              users.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold mr-2">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={
                        user.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                      }
                      alt={user.full_name}
                    />
                    <AvatarFallback>
                      {user.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-sm font-medium">
                        {user.full_name}
                      </div>
                      {index === 0 && timeFrame !== "all" && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                          <Award className="h-3 w-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      Level {user.level}
                      {user.badges.length > 0 && (
                        <span className="ml-2 flex items-center">
                          {user.badges.slice(0, 2).map((badge) => (
                            <span
                              key={badge.id}
                              className="mr-1"
                              title={badge.name}
                            >
                              {badge.icon}
                            </span>
                          ))}
                          {user.badges.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{user.badges.length - 2}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-purple-600">
                    {user.exp} EXP
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


