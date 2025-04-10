import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  Calendar, 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Clock,
  TrendingUp,
  Activity,
  Search,
  Tag,
  Award
} from "lucide-react";

interface ForumStatistics {
  totalThreads: number;
  totalReplies: number;
  totalUsers: number;
  activeUsers: number;
  threadsToday: number;
  repliesToday: number;
  topCategories: Array<{
    id: string;
    name: string;
    thread_count: number;
    percentage: number;
  }>;
  topTags: Array<{
    id: string;
    name: string;
    color: string;
    usage_count: number;
  }>;
  topContributors: Array<{
    user_id: string;
    username: string;
    avatar_url: string;
    exp: number;
    thread_count: number;
    reply_count: number;
  }>;
  trendingThreads: Array<{
    id: string;
    title: string;
    user_id: string;
    username: string;
    view_count: number;
    reply_count: number;
    created_at: string;
  }>;
  activityByDay: Array<{
    date: string;
    threads: number;
    replies: number;
  }>;
}

type TimeFrame = "week" | "month" | "year" | "all";

export default function ForumAnalytics() {
  const { user, isAdmin, isModerator } = useAuth();
  const { toast } = useToast();
  
  const [statistics, setStatistics] = useState<ForumStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("month");
  
  useEffect(() => {
    // Only admins and moderators can access analytics
    if (user && (isAdmin || isModerator)) {
      fetchStatistics();
    }
  }, [user, isAdmin, isModerator, timeFrame]);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on time frame
      let startDate: Date | null = null;
      if (timeFrame !== "all") {
        startDate = new Date();
        if (timeFrame === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeFrame === "month") {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeFrame === "year") {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }
      }
      
      const startDateStr = startDate ? startDate.toISOString() : null;
      
      // Get forum statistics
      const { data, error } = await supabase.rpc("get_forum_statistics", {
        time_frame: timeFrame,
        start_date: startDateStr
      });
      
      if (error) throw error;
      
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching forum statistics:", error);
      toast({
        title: "Error",
        description: "Failed to load forum statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !statistics) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!statistics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No statistics available</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <BarChart className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Forum Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              Insights and statistics about forum activity
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={timeFrame}
            onValueChange={(value) => setTimeFrame(value as TimeFrame)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchStatistics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Threads</p>
                <h3 className="text-2xl font-bold mt-1">{statistics.totalThreads.toLocaleString()}</h3>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {statistics.threadsToday} new today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Replies</p>
                <h3 className="text-2xl font-bold mt-1">{statistics.totalReplies.toLocaleString()}</h3>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {statistics.repliesToday} new today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{statistics.totalUsers.toLocaleString()}</h3>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {statistics.activeUsers} active in this period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                <h3 className="text-2xl font-bold mt-1">
                  {statistics.totalThreads > 0 
                    ? Math.round((statistics.totalReplies / statistics.totalThreads) * 10) / 10
                    : 0}
                </h3>
              </div>
              <Activity className="h-8 w-8 text-amber-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Replies per thread average
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="activity" className="flex items-center">
            <LineChart className="h-4 w-4 mr-1" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <PieChart className="h-4 w-4 mr-1" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Trending
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>
                Thread and reply activity for the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.activityByDay.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activity data available for this time period
                </div>
              ) : (
                <div className="h-80">
                  {/* In a real implementation, you would use a chart library like Chart.js or Recharts */}
                  <div className="text-center py-8 text-gray-500">
                    Activity chart would be displayed here
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Most Active Days</h4>
                      <div className="space-y-2">
                        {statistics.activityByDay
                          .sort((a, b) => (b.threads + b.replies) - (a.threads + a.replies))
                          .slice(0, 5)
                          .map((day, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <span>{new Date(day.date).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <Badge variant="outline">
                                  {day.threads + day.replies} activities
                                </Badge>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Activity Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                            <span>Total Threads</span>
                          </div>
                          <div>
                            <Badge>
                              {statistics.activityByDay.reduce((sum, day) => sum + day.threads, 0)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>Total Replies</span>
                          </div>
                          <div>
                            <Badge>
                              {statistics.activityByDay.reduce((sum, day) => sum + day.replies, 0)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Average Daily Activity</span>
                          </div>
                          <div>
                            <Badge variant="outline">
                              {statistics.activityByDay.length > 0
                                ? Math.round(
                                    statistics.activityByDay.reduce(
                                      (sum, day) => sum + day.threads + day.replies, 
                                      0
                                    ) / statistics.activityByDay.length
                                  )
                                : 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>
                Thread distribution across forum categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No category data available
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-64">
                    {/* In a real implementation, you would use a chart library like Chart.js or Recharts */}
                    <div className="text-center py-8 text-gray-500">
                      Category distribution chart would be displayed here
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Top Categories</h4>
                    <div className="space-y-3">
                      {statistics.topCategories.map((category, index) => (
                        <div key={category.id} className="flex items-center">
                          <div className="w-8 text-center font-medium text-gray-500">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{category.name}</div>
                            <div className="flex items-center mt-1">
                              <div className="h-2 bg-primary rounded-full" style={{ width: `${category.percentage}%` }} />
                              <span className="ml-2 text-sm text-gray-500">
                                {category.thread_count} threads ({category.percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Popular Tags</CardTitle>
              <CardDescription>
                Most used tags in forum threads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topTags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tag data available
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {statistics.topTags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        className={tag.color}
                        variant="secondary"
                      >
                        {tag.name}
                        <span className="ml-1 text-xs">({tag.usage_count})</span>
                      </Badge>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Top Tags by Usage</h4>
                    <div className="space-y-3">
                      {statistics.topTags.slice(0, 10).map((tag, index) => (
                        <div key={tag.id} className="flex items-center">
                          <div className="w-8 text-center font-medium text-gray-500">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <Badge className={tag.color}>{tag.name}</Badge>
                            </div>
                            <div className="flex items-center mt-1">
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (tag.usage_count / statistics.topTags[0].usage_count) * 100)}%` 
                                }} 
                              />
                              <span className="ml-2 text-sm text-gray-500">
                                {tag.usage_count} threads
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>
                Most active users in the forum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topContributors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No user data available
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics.topContributors.map((user, index) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center p-3 rounded-md border bg-white"
                    >
                      <div className="w-8 text-center font-semibold text-gray-500">
                        #{index + 1}
                      </div>
                      
                      <Avatar className="h-10 w-10 ml-3">
                        <AvatarImage 
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} 
                          alt={user.username} 
                        />
                        <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="font-medium truncate">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.exp.toLocaleString()} XP
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-medium">{user.thread_count}</div>
                          <div className="text-xs text-gray-500">Threads</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium">{user.reply_count}</div>
                          <div className="text-xs text-gray-500">Replies</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {Math.round((user.thread_count + user.reply_count) / 
                              statistics.topContributors.reduce(
                                (sum, u) => sum + u.thread_count + u.reply_count, 0
                              ) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Share</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Trending Threads</CardTitle>
              <CardDescription>
                Most popular and active threads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.trendingThreads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trending threads available
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics.trendingThreads.map((thread, index) => (
                    <div 
                      key={thread.id} 
                      className="flex items-start p-3 rounded-md border bg-white"
                    >
                      <div className="w-8 text-center font-semibold text-gray-500 mt-1">
                        #{index + 1}
                      </div>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <a 
                          href={`/forum/thread/${thread.id}`} 
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {thread.title}
                        </a>
                        
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="flex items-center mr-3">
                            <Users className="h-3 w-3 mr-1" />
                            {thread.username}
                          </span>
                          
                          <span className="flex items-center mr-3">
                            <Eye className="h-3 w-3 mr-1" />
                            {thread.view_count} views
                          </span>
                          
                          <span className="flex items-center mr-3">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {thread.reply_count} replies
                          </span>
                          
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Badge className="ml-2 bg-red-100 text-red-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing component imports
import { MessageCircle, RefreshCw, Eye } from "lucide-react";
