import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  Flag,
  Ban,
  MessageSquare,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";

// Types for statistics
interface SecurityStats {
  totalReports: number;
  pendingReports: number;
  actionTakenReports: number;
  totalSpamViolations: number;
  totalBlockedUsers: number;
  totalVerifiedUsers: number;
  reportsByReason: { name: string; value: number }[];
  spamViolationsByReason: { name: string; value: number }[];
  reportsTimeline: { date: string; count: number }[];
  spamTimeline: { date: string; count: number }[];
}

// Colors for charts
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
];

export default function SecurityDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) return;

    // Check if user is admin
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error || !data || !data.is_admin) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses halaman ini.",
          variant: "destructive",
        });
        // Redirect to home page
        window.location.href = "/";
        return;
      }

      fetchSecurityStats();
    };

    checkAdmin();
  }, [user, toast]);

  const fetchSecurityStats = async () => {
    try {
      setLoading(true);

      // Fetch total reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("message_reports")
        .select("id, reason, status, created_at");

      if (reportsError) throw reportsError;

      // Fetch spam violations
      const { data: spamData, error: spamError } = await supabase
        .from("spam_violations")
        .select("id, reason, created_at");

      if (spamError) throw spamError;

      // Fetch blocked users
      const { data: blockedData, error: blockedError } = await supabase
        .from("user_blocks")
        .select("id");

      if (blockedError) throw blockedError;

      // Fetch verified users
      const { data: verifiedData, error: verifiedError } = await supabase
        .from("private_conversation_participants")
        .select("id")
        .eq("is_identity_verified", true);

      if (verifiedError) throw verifiedError;

      // Process reports by reason
      const reportsByReason = processReasonCounts(
        reportsData?.map((report) => report.reason) || []
      );

      // Process spam violations by reason
      const spamViolationsByReason = processReasonCounts(
        spamData?.map((spam) => spam.reason) || []
      );

      // Process reports timeline
      const reportsTimeline = processTimeline(
        reportsData?.map((report) => report.created_at) || []
      );

      // Process spam timeline
      const spamTimeline = processTimeline(
        spamData?.map((spam) => spam.created_at) || []
      );

      // Set statistics
      setStats({
        totalReports: reportsData?.length || 0,
        pendingReports:
          reportsData?.filter((report) => report.status === "pending").length ||
          0,
        actionTakenReports:
          reportsData?.filter((report) => report.status === "action_taken")
            .length || 0,
        totalSpamViolations: spamData?.length || 0,
        totalBlockedUsers: blockedData?.length || 0,
        totalVerifiedUsers: verifiedData?.length || 0,
        reportsByReason,
        spamViolationsByReason,
        reportsTimeline,
        spamTimeline,
      });
    } catch (error) {
      console.error("Error fetching security stats:", error);
      toast({
        title: "Error",
        description: "Gagal memuat statistik keamanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Process reason counts for charts
  const processReasonCounts = (reasons: string[]): { name: string; value: number }[] => {
    const counts: Record<string, number> = {};
    
    reasons.forEach((reason) => {
      counts[reason] = (counts[reason] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: getReasonLabel(name),
      value,
    }));
  };

  // Process timeline data for charts
  const processTimeline = (dates: string[]): { date: string; count: number }[] => {
    const counts: Record<string, number> = {};
    
    // Group by date (YYYY-MM-DD)
    dates.forEach((dateStr) => {
      const date = new Date(dateStr).toISOString().split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    
    // Convert to array and sort by date
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get human-readable reason label
  const getReasonLabel = (reason: string): string => {
    switch (reason) {
      case "inappropriate":
        return "Konten tidak pantas";
      case "harassment":
        return "Pelecehan";
      case "spam":
        return "Spam";
      case "personal_info":
        return "Info pribadi";
      case "flooding":
        return "Flooding";
      case "duplicate_message":
        return "Pesan duplikat";
      case "too_many_links":
        return "Terlalu banyak tautan";
      case "message_too_long":
        return "Pesan terlalu panjang";
      case "other":
        return "Lainnya";
      default:
        return reason;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="h-6 w-6 mr-2 text-purple-600" />
          Dashboard Keamanan
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSecurityStats}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
            <p className="text-gray-500">Memuat statistik keamanan...</p>
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Flag className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalReports}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingReports} menunggu review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pelanggaran Spam
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {stats.totalSpamViolations}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Terdeteksi oleh sistem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pengguna Diblokir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Ban className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {stats.totalBlockedUsers}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Oleh pengguna lain
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Tindakan Diambil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {stats.actionTakenReports}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Dari {stats.totalReports} laporan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pengguna Terverifikasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {stats.totalVerifiedUsers}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Identitas terverifikasi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Rasio Tindakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {stats.totalReports > 0
                      ? Math.round(
                          (stats.actionTakenReports / stats.totalReports) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Laporan yang ditindaklanjuti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed stats */}
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
              <TabsTrigger value="reports">Laporan</TabsTrigger>
              <TabsTrigger value="spam">Spam</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Distribusi Alasan Laporan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.reportsByReason}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              percent,
                              name,
                            }) => {
                              const radius =
                                innerRadius +
                                (outerRadius - innerRadius) * 1.4;
                              const x =
                                cx +
                                radius *
                                  Math.cos(-midAngle * (Math.PI / 180));
                              const y =
                                cy +
                                radius *
                                  Math.sin(-midAngle * (Math.PI / 180));
                              return percent > 0.05 ? (
                                <text
                                  x={x}
                                  y={y}
                                  fill="#888"
                                  textAnchor={x > cx ? "start" : "end"}
                                  dominantBaseline="central"
                                  fontSize={12}
                                >
                                  {name} ({(percent * 100).toFixed(0)}%)
                                </text>
                              ) : null;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.reportsByReason.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Distribusi Alasan Spam
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.spamViolationsByReason}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              percent,
                              name,
                            }) => {
                              const radius =
                                innerRadius +
                                (outerRadius - innerRadius) * 1.4;
                              const x =
                                cx +
                                radius *
                                  Math.cos(-midAngle * (Math.PI / 180));
                              const y =
                                cy +
                                radius *
                                  Math.sin(-midAngle * (Math.PI / 180));
                              return percent > 0.05 ? (
                                <text
                                  x={x}
                                  y={y}
                                  fill="#888"
                                  textAnchor={x > cx ? "start" : "end"}
                                  dominantBaseline="central"
                                  fontSize={12}
                                >
                                  {name} ({(percent * 100).toFixed(0)}%)
                                </text>
                              ) : null;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.spamViolationsByReason.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Laporan Berdasarkan Alasan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.reportsByReason}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="value"
                          name="Jumlah Laporan"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spam Tab */}
            <TabsContent value="spam">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Pelanggaran Spam Berdasarkan Alasan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.spamViolationsByReason}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="value"
                          name="Jumlah Pelanggaran"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Timeline Laporan dan Spam
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            ...stats.reportsTimeline.map((item) => ({
                              date: item.date,
                              Laporan: item.count,
                              Spam: 0,
                            })),
                            ...stats.spamTimeline.map((item) => ({
                              date: item.date,
                              Laporan: 0,
                              Spam: item.count,
                            })),
                          ].reduce((acc, item) => {
                            const existingItem = acc.find(
                              (i) => i.date === item.date
                            );
                            if (existingItem) {
                              existingItem.Laporan += item.Laporan;
                              existingItem.Spam += item.Spam;
                            } else {
                              acc.push(item);
                            }
                            return acc;
                          }, [] as { date: string; Laporan: number; Spam: number }[])
                            .sort((a, b) => a.date.localeCompare(b.date))}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 60,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="Laporan"
                            stackId="a"
                            fill="#8884d8"
                          />
                          <Bar dataKey="Spam" stackId="a" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Tidak ada data
          </h3>
          <p className="text-gray-500">
            Belum ada data keamanan yang tersedia.
          </p>
        </div>
      )}
    </div>
  );
}
