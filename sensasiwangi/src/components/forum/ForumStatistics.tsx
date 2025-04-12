// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Users, MessageSquare, TrendingUp, RefreshCw } from "lucide-react";
// @ts-ignore
import { getForumStatistics } from "../../lib/forum";
// @ts-ignore
import { ForumStatistics as ForumStatsType } from "../../types/forum";

export default function ForumStatistics() {
  const [stats, setStats] = useState<ForumStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await getForumStatistics();
      setStats(data);
    } catch (error) {
      console.error("Error fetching forum statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
            <span>Statistik Forum</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatistics}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900 flex items-center justify-between">
          <span>Statistik Forum</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatistics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{stats.totalThreads}</div>
              <div className="text-xs text-gray-500">Total Thread</div>
            </div>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{stats.totalReplies}</div>
              <div className="text-xs text-gray-500">Total Balasan</div>
            </div>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <div className="text-xs text-gray-500">Pengguna Aktif</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium mb-2">Top Kontributor</h3>
          {stats.topContributors.slice(0, 3).map((contributor, index) => (
            <div
              key={contributor.user_id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold mr-2">
                  {index + 1}
                </div>
                <Link to={`/profile/${contributor.user_id}`}>
                  <Avatar className="h-8 w-8 mr-2 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
                    <AvatarImage
                      src={
                        contributor.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.user_id}`
                      }
                      alt={contributor.full_name}
                    />
                    <AvatarFallback>
                      {contributor.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="text-sm font-medium">
                    {contributor.full_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {contributor.exp} EXP
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {contributor.thread_count + contributor.reply_count}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>Hari ini: {stats.threadsToday} thread baru</div>
            <div>{stats.repliesToday} balasan baru</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


