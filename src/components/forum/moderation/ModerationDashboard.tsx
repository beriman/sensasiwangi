import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Search, 
  Filter, 
  BarChart, 
  Users, 
  MessageSquare,
  Shield
} from "lucide-react";

interface ForumReport {
  id: string;
  reporter_id: string;
  thread_id?: string;
  reply_id?: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  priority: "normal" | "high";
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  resolution_notes?: string;
  reporter?: {
    username: string;
    avatar_url: string;
  };
  thread?: {
    title: string;
    content: string;
    user_id: string;
  };
  reply?: {
    content: string;
    user_id: string;
  };
}

export default function ModerationDashboard() {
  const { user, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ForumReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Stats
  const [stats, setStats] = useState({
    pendingReports: 0,
    resolvedToday: 0,
    highPriorityPending: 0,
    averageResolutionTime: 0,
  });

  useEffect(() => {
    // Redirect if not admin or moderator
    if (user && !isAdmin && !isModerator) {
      navigate("/forum");
      return;
    }
    
    fetchReports();
    fetchStats();
  }, [user, isAdmin, isModerator, navigate]);
  
  useEffect(() => {
    filterReports();
  }, [reports, statusFilter, searchTerm]);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("forum_reports")
        .select(`
          *,
          reporter:reporter_id(username, avatar_url),
          thread:thread_id(title, content, user_id),
          reply:reply_id(content, user_id)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load moderation reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      // Get pending reports count
      const { count: pendingCount } = await supabase
        .from("forum_reports")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      
      // Get high priority pending reports
      const { count: highPriorityCount } = await supabase
        .from("forum_reports")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .eq("priority", "high");
      
      // Get reports resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: resolvedTodayCount } = await supabase
        .from("forum_reports")
        .select("*", { count: "exact" })
        .eq("status", "resolved")
        .gte("updated_at", today.toISOString());
      
      // Calculate average resolution time (simplified)
      const { data: resolvedReports } = await supabase
        .from("forum_reports")
        .select("created_at, updated_at")
        .eq("status", "resolved")
        .limit(100);
      
      let totalResolutionTime = 0;
      let reportCount = 0;
      
      if (resolvedReports && resolvedReports.length > 0) {
        resolvedReports.forEach(report => {
          const createdAt = new Date(report.created_at);
          const updatedAt = new Date(report.updated_at);
          const resolutionTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
          totalResolutionTime += resolutionTime;
          reportCount++;
        });
      }
      
      const averageResolutionTime = reportCount > 0 ? totalResolutionTime / reportCount : 0;
      
      setStats({
        pendingReports: pendingCount || 0,
        resolvedToday: resolvedTodayCount || 0,
        highPriorityPending: highPriorityCount || 0,
        averageResolutionTime: parseFloat(averageResolutionTime.toFixed(2)),
      });
    } catch (error) {
      console.error("Error fetching moderation stats:", error);
    }
  };
  
  const filterReports = () => {
    let filtered = [...reports];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.reason.toLowerCase().includes(term) ||
        report.thread?.title?.toLowerCase().includes(term) ||
        report.thread?.content?.toLowerCase().includes(term) ||
        report.reply?.content?.toLowerCase().includes(term) ||
        report.reporter?.username?.toLowerCase().includes(term)
      );
    }
    
    setFilteredReports(filtered);
  };
  
  const handleResolveReport = async (reportId: string, action: "resolve" | "reject") => {
    try {
      const { error } = await supabase
        .from("forum_reports")
        .update({
          status: action === "resolve" ? "resolved" : "rejected",
          resolved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      
      if (error) throw error;
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: action === "resolve" ? "resolved" : "rejected",
              resolved_by: user?.id,
              updated_at: new Date().toISOString()
            } 
          : report
      ));
      
      toast({
        title: action === "resolve" ? "Report Resolved" : "Report Rejected",
        description: `The report has been ${action === "resolve" ? "resolved" : "rejected"} successfully.`,
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error(`Error ${action}ing report:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} the report`,
        variant: "destructive",
      });
    }
  };
  
  const handlePriorityChange = async (reportId: string, priority: "normal" | "high") => {
    try {
      const { error } = await supabase
        .from("forum_reports")
        .update({
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      
      if (error) throw error;
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              priority,
              updated_at: new Date().toISOString()
            } 
          : report
      ));
      
      toast({
        title: "Priority Updated",
        description: `Report priority set to ${priority}.`,
      });
    } catch (error) {
      console.error("Error updating priority:", error);
      toast({
        title: "Error",
        description: "Failed to update report priority",
        variant: "destructive",
      });
    }
  };
  
  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            Forum Moderation Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage reported content and monitor forum activity
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingReports}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <h3 className="text-2xl font-bold mt-1">{stats.highPriorityPending}</h3>
              </div>
              <Flag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved Today</p>
                <h3 className="text-2xl font-bold mt-1">{stats.resolvedToday}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Resolution Time</p>
                <h3 className="text-2xl font-bold mt-1">{stats.averageResolutionTime}h</h3>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs and Filters */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {filteredReports.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500">No reports found matching your criteria.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            report.status === "pending" ? "outline" :
                            report.status === "resolved" ? "success" : "secondary"
                          }>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                          
                          <Badge variant={report.priority === "high" ? "destructive" : "outline"}>
                            {report.priority === "high" ? "High Priority" : "Normal Priority"}
                          </Badge>
                          
                          <span className="text-sm text-gray-500">
                            Reported {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {report.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={report.priority}
                              onValueChange={(value) => handlePriorityChange(report.id, value as "normal" | "high")}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Set priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "resolve")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold mb-1">Reason for Report:</h3>
                        <p className="text-gray-700">{report.reason}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold mb-1">Reported Content:</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          {report.thread ? (
                            <div>
                              <p className="font-medium">{report.thread.title}</p>
                              <p className="text-gray-700 mt-1 line-clamp-3">{report.thread.content}</p>
                            </div>
                          ) : report.reply ? (
                            <p className="text-gray-700 line-clamp-3">{report.reply.content}</p>
                          ) : (
                            <p className="text-gray-500 italic">Content not available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Reported by:</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage 
                                src={report.reporter?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reporter_id}`} 
                                alt={report.reporter?.username || "User"} 
                              />
                              <AvatarFallback>{report.reporter?.username?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{report.reporter?.username || "Unknown User"}</span>
                          </div>
                        </div>
                        
                        {report.status !== "pending" && report.resolved_by && (
                          <div className="text-sm text-gray-500">
                            {report.status === "resolved" ? "Resolved" : "Rejected"} by moderator
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>
                Analyze forum content for trends, quality, and potential issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-12">
                Content analysis features coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user permissions, warnings, and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-12">
                User management features coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing component imports
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
