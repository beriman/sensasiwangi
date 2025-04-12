// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
// @ts-ignore
import { Progress } from "../../components/ui/progress";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import {
  CalendarDays,
  BarChart2,
  Users,
  Clock,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Activity,
  UserPlus,
} from "lucide-react";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { getForumStatistics } from "../../lib/forum";
// @ts-ignore
import { getProducts } from "../../lib/marketplace";
// @ts-ignore
import { getSambatans } from "../../lib/sambatan";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";

interface ProjectCardProps {
  title: string;
  progress: number;
  team: Array<{ name: string; avatar: string }>;
  dueDate: string;
}

interface DashboardGridProps {
  projects?: ProjectCardProps[];
  isLoading?: boolean;
}

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    userGrowth: number;
  };
  forumStats: {
    totalThreads: number;
    recentThreads: number;
    forumActivity: number;
    popularThreads: Array<{
      id: string;
      title: string;
      user: {
        full_name: string;
      };
      created_at: string;
    }>;
  };
  marketplaceStats: {
    totalProducts: number;
    totalTransactions: number;
    pendingTransactions: number;
    trendingProducts: Array<{
      id: string;
      name: string;
      price: number;
      seller: {
        full_name: string;
      };
    }>;
  };
  sambatanStats: {
    totalSambatans: number;
    activeSambatans: number;
    completedSambatans: number;
    activeSambatansList: Array<{
      id: string;
      product: {
        name: string;
        price: number;
      };
      initiator: {
        full_name: string;
      };
      target_quantity: number;
      current_quantity: number;
      status: string;
      expires_at?: string;
    }>;
  };
}

const defaultProjects: ProjectCardProps[] = [
  {
    title: "Website Redesign",
    progress: 75,
    team: [
      {
        name: "Alice",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      },
      {
        name: "Bob",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      },
      {
        name: "Charlie",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
      },
    ],
    dueDate: "2024-04-15",
  },
  {
    title: "Mobile App Development",
    progress: 45,
    team: [
      {
        name: "David",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      },
      {
        name: "Eve",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
      },
    ],
    dueDate: "2024-05-01",
  },
  {
    title: "Marketing Campaign",
    progress: 90,
    team: [
      {
        name: "Frank",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
      },
      {
        name: "Grace",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
      },
      {
        name: "Henry",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Henry",
      },
    ],
    dueDate: "2024-03-30",
  },
];

const ProjectCard = ({ title, progress, team, dueDate }: ProjectCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
          <BarChart2 className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-900">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-gray-100 rounded-full"
              style={
                {
                  backgroundColor: "rgb(243, 244, 246)",
                } as React.CSSProperties
              }
            />
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Due {dueDate}</span>
            </div>
            <div className="flex -space-x-2">
              {team.map((member, i) => (
                <Avatar
                  key={i}
                  className="h-7 w-7 border-2 border-white shadow-sm"
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardGrid = ({
  projects = defaultProjects,
  isLoading = false,
}: DashboardGridProps) => {
  const [loading, setLoading] = useState(isLoading || true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Fetch user statistics
        const { count: totalUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // Get active users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: activeUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Fetch forum statistics
        const forumStats = await getForumStatistics();

        // Fetch recent forum threads
        const { data: popularThreads } = await supabase
          .from("forum_threads")
          .select("id, title, user_id, created_at, user:user_id(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch marketplace statistics
        const { count: totalProducts } = await supabase
          .from("marketplace_products")
          .select("*", { count: "exact", head: true });

        const { count: totalTransactions } = await supabase
          .from("marketplace_transactions")
          .select("*", { count: "exact", head: true });

        const { count: pendingTransactions } = await supabase
          .from("marketplace_transactions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch trending products
        const products = await getProducts();
        const trendingProducts = products.slice(0, 5);

        // Fetch sambatan statistics
        const { count: totalSambatans } = await supabase
          .from("sambatan")
          .select("*", { count: "exact", head: true });

        const { count: activeSambatans } = await supabase
          .from("sambatan")
          .select("*", { count: "exact", head: true })
          .eq("status", "open");

        const { count: completedSambatans } = await supabase
          .from("sambatan")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed");

        // Fetch active sambatans list
        const activeSambatansList = await getSambatans();

        setAnalyticsData({
          userStats: {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            userGrowth:
              activeUsers && totalUsers
                ? Math.round((activeUsers / totalUsers) * 100)
                : 0,
          },
          forumStats: {
            totalThreads: forumStats.totalThreads,
            recentThreads: forumStats.threadsToday,
            forumActivity:
              forumStats.threadsToday > 0 && forumStats.totalThreads > 0
                ? Math.round(
                    (forumStats.threadsToday / forumStats.totalThreads) * 100,
                  )
                : 0,
            popularThreads: popularThreads || [],
          },
          marketplaceStats: {
            totalProducts: totalProducts || 0,
            totalTransactions: totalTransactions || 0,
            pendingTransactions: pendingTransactions || 0,
            trendingProducts: trendingProducts || [],
          },
          sambatanStats: {
            totalSambatans: totalSambatans || 0,
            activeSambatans: activeSambatans || 0,
            completedSambatans: completedSambatans || 0,
            activeSambatansList: activeSambatansList.slice(0, 5) || [],
          },
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm h-[220px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-500/20 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Loading analytics data...
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Analytics Cards */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-blue-600">
              <Users className="h-5 w-5 mr-2" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.userStats.totalUsers || 0}
                </p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.userStats.activeUsers || 0}
                </p>
                <p className="text-sm text-gray-500">Last 30 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forum Analytics Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-600">
              <MessageSquare className="h-5 w-5 mr-2" />
              Forum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.forumStats.totalThreads || 0}
                </p>
                <p className="text-sm text-gray-500">Total Threads</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.forumStats.recentThreads || 0}
                </p>
                <p className="text-sm text-gray-500">Today's Threads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Analytics Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-green-600">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.marketplaceStats.totalProducts || 0}
                </p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.marketplaceStats.totalTransactions || 0}
                </p>
                <p className="text-sm text-gray-500">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Analytics Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-amber-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.userStats.userGrowth || 0}%
                </p>
                <p className="text-sm text-gray-500">User Growth</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.forumStats.forumActivity || 0}%
                </p>
                <p className="text-sm text-gray-500">Forum Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sambatan Analytics Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-600">
              <UserPlus className="h-5 w-5 mr-2" />
              Sambatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.sambatanStats.totalSambatans || 0}
                </p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.sambatanStats.activeSambatans || 0}
                </p>
                <p className="text-sm text-gray-500">Aktif</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {analyticsData?.sambatanStats.completedSambatans || 0}
                </p>
                <p className="text-sm text-gray-500">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Threads Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Popular Forum Threads</CardTitle>
            <CardDescription>
              Recent discussions in the community
            </CardDescription>
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
                  {analyticsData?.forumStats.popularThreads.map((thread) => (
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
                  {(!analyticsData?.forumStats.popularThreads ||
                    analyticsData.forumStats.popularThreads.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        No threads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Trending Products Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Trending Products</CardTitle>
            <CardDescription>Popular items in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Seller</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData?.marketplaceStats.trendingProducts.map(
                    (product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">
                          {product.name}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {product.seller?.full_name || "Unknown"}
                        </td>
                      </tr>
                    ),
                  )}
                  {(!analyticsData?.marketplaceStats.trendingProducts ||
                    analyticsData.marketplaceStats.trendingProducts.length ===
                      0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Active Sambatan Card */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                Sambatan Aktif
              </CardTitle>
              <CardDescription>
                Patungan yang sedang berlangsung
              </CardDescription>
            </div>
            <Link to="/marketplace/sambatan">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Produk</th>
                    <th className="px-4 py-2">Inisiator</th>
                    <th className="px-4 py-2">Progress</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Berakhir Pada</th>
                    <th className="px-4 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData?.sambatanStats.activeSambatansList.map(
                    (sambatan) => {
                      const progress =
                        (sambatan.current_quantity / sambatan.target_quantity) *
                        100;
                      const isExpired =
                        sambatan.expires_at &&
                        new Date(sambatan.expires_at) < new Date();

                      return (
                        <tr key={sambatan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium">
                            {sambatan.product.name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {sambatan.initiator?.full_name || "Unknown"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="w-full max-w-[100px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span>
                                  {sambatan.current_quantity}/
                                  {sambatan.target_quantity}
                                </span>
                                <span>{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <Badge
                              className={
                                sambatan.status === "open" && !isExpired
                                  ? "bg-green-100 text-green-800"
                                  : sambatan.status === "cancelled" || isExpired
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {sambatan.status === "open" && !isExpired
                                ? "Terbuka"
                                : sambatan.status === "cancelled"
                                  ? "Dibatalkan"
                                  : isExpired && sambatan.status === "open"
                                    ? "Kedaluwarsa"
                                    : "Tertutup"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {sambatan.expires_at
                              ? new Date(
                                  sambatan.expires_at,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <Link to={`/marketplace/sambatan/${sambatan.id}`}>
                              <Button variant="ghost" size="sm">
                                Detail
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    },
                  )}
                  {(!analyticsData?.sambatanStats.activeSambatansList ||
                    analyticsData.sambatanStats.activeSambatansList.length ===
                      0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-center text-sm text-gray-500"
                      >
                        Tidak ada Sambatan aktif saat ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Project Cards */}
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
};

export default DashboardGrid;


