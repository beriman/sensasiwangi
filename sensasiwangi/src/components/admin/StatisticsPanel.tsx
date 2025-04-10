import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Users, MessageSquare, ShoppingBag, TrendingUp } from "lucide-react";

type StatisticsData = {
  totalUsers: number;
  activeUsers: number;
  totalThreads: number;
  recentThreads: number;
  totalTransactions: number;
  pendingTransactions: number;
  recentUsers: Array<{
    id: string;
    full_name: string;
    email: string;
    created_at: string;
  }>;
  recentThreadsList: Array<{
    id: string;
    title: string;
    user_id: string;
    created_at: string;
    user: {
      full_name: string;
    };
  }>;
};

const StatisticsPanel = () => {
  const [stats, setStats] = useState<StatisticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalThreads: 0,
    recentThreads: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    recentUsers: [],
    recentThreadsList: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Get recent users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers, error: activeUsersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Get recent users list
      const { data: recentUsers, error: recentUsersError } = await supabase
        .from("users")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get total threads count
      const { count: totalThreads, error: threadsError } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true });

      // Get recent threads (last 30 days)
      const { count: recentThreads, error: recentThreadsError } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Get recent threads list
      const { data: recentThreadsList, error: recentThreadsListError } =
        await supabase
          .from("forum_threads")
          .select("id, title, user_id, created_at, user:user_id(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);

      // Get total transactions count
      const { count: totalTransactions, error: transactionsError } =
        await supabase
          .from("marketplace_transactions")
          .select("*", { count: "exact", head: true });

      // Get pending transactions count
      const { count: pendingTransactions, error: pendingTransactionsError } =
        await supabase
          .from("marketplace_transactions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

      if (
        usersError ||
        activeUsersError ||
        recentUsersError ||
        threadsError ||
        recentThreadsError ||
        recentThreadsListError ||
        transactionsError ||
        pendingTransactionsError
      ) {
        throw new Error("Error fetching statistics");
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalThreads: totalThreads || 0,
        recentThreads: recentThreads || 0,
        totalTransactions: totalTransactions || 0,
        pendingTransactions: pendingTransactions || 0,
        recentUsers: recentUsers || [],
        recentThreadsList: recentThreadsList || [],
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast({
        variant: "destructive",
        title: "Error fetching statistics",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={fetchStatistics}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Statistics"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-blue-600">
              <Users className="h-5 w-5 mr-2" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
                <p className="text-sm text-gray-500">Last 30 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forum Stats */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-600">
              <MessageSquare className="h-5 w-5 mr-2" />
              Forum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">{stats.totalThreads}</p>
                <p className="text-sm text-gray-500">Total Threads</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.recentThreads}</p>
                <p className="text-sm text-gray-500">Last 30 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Stats */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-green-600">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                <p className="text-sm text-gray-500">Total Transactions</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {stats.pendingTransactions}
                </p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Stats */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-amber-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {stats.activeUsers > 0 && stats.totalUsers > 0
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-500">User Growth</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {stats.recentThreads > 0 && stats.totalThreads > 0
                    ? Math.round(
                        (stats.recentThreads / stats.totalThreads) * 100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-500">Forum Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>New users who joined recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {user.full_name || "No Name"}
                      </td>
                      <td className="px-4 py-2 text-sm">{user.email}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {stats.recentUsers.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        No recent users
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Threads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Forum Threads</CardTitle>
            <CardDescription>Latest discussions in the forum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Author</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentThreadsList.map((thread) => (
                    <tr key={thread.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">
                        {thread.title}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {thread.user?.full_name || "Unknown"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(thread.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {stats.recentThreadsList.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        No recent threads
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPanel;
