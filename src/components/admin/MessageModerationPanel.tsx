import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flag,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  MessageSquare,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageRenderer from "../messages/MessageRenderer";

interface MessageReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string;
  reason: string;
  additional_info: string | null;
  message_content: string;
  status: "pending" | "reviewed" | "dismissed" | "action_taken";
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
  reporter?: {
    full_name: string;
    avatar_url: string;
  };
  reported_user?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function MessageModerationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [filter, setFilter] = useState<"pending" | "all" | "reviewed" | "dismissed" | "action_taken">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      fetchReports();
    };

    checkAdmin();
  }, [user, toast]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("message_reports")
        .select(`
          *,
          reporter:reporter_id(full_name, avatar_url),
          reported_user:reported_user_id(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });
      
      // Apply filter
      if (filter !== "all") {
        query = query.eq("status", filter);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Gagal memuat laporan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: MessageReport) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };

  const handleDismissReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("message_reports")
        .update({
          status: "dismissed",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.id);

      if (error) throw error;
      
      toast({
        title: "Laporan Diabaikan",
        description: "Laporan telah ditandai sebagai diabaikan.",
      });
      
      // Update local state
      setReports(reports.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: "dismissed", reviewed_by: user?.id, reviewed_at: new Date().toISOString() } 
          : r
      ));
      
      setShowReportDetails(false);
    } catch (error) {
      console.error("Error dismissing report:", error);
      toast({
        title: "Error",
        description: "Gagal mengabaikan laporan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeAction = async () => {
    if (!selectedReport || !actionReason) return;
    
    try {
      setIsSubmitting(true);
      
      // Update report status
      const { error: reportError } = await supabase
        .from("message_reports")
        .update({
          status: "action_taken",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: actionReason,
        })
        .eq("id", selectedReport.id);

      if (reportError) throw reportError;
      
      // Delete the reported message
      const { error: messageError } = await supabase
        .from("private_messages")
        .update({
          content: "<p><em>Pesan ini telah dihapus oleh moderator</em></p>",
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.message_id);

      if (messageError) throw messageError;
      
      toast({
        title: "Tindakan Diambil",
        description: "Pesan telah dihapus dan laporan ditandai sebagai ditindaklanjuti.",
      });
      
      // Update local state
      setReports(reports.map(r => 
        r.id === selectedReport.id 
          ? { 
              ...r, 
              status: "action_taken", 
              reviewed_by: user?.id, 
              reviewed_at: new Date().toISOString(),
              action_taken: actionReason
            } 
          : r
      ));
      
      setShowReportDetails(false);
      setActionReason("");
    } catch (error) {
      console.error("Error taking action:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil tindakan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Menunggu Review
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="h-3 w-3 mr-1" />
            Ditinjau
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Diabaikan
          </Badge>
        );
      case "action_taken":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ditindaklanjuti
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "inappropriate":
        return "Konten tidak pantas";
      case "harassment":
        return "Pelecehan atau intimidasi";
      case "spam":
        return "Spam atau penipuan";
      case "personal_info":
        return "Informasi pribadi";
      case "other":
        return "Alasan lain";
      default:
        return reason;
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      report.reported_user?.full_name?.toLowerCase().includes(searchLower) ||
      report.reporter?.full_name?.toLowerCase().includes(searchLower) ||
      report.reason.toLowerCase().includes(searchLower) ||
      report.message_content.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Moderasi Pesan
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <></>
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Tabs
                defaultValue="pending"
                value={filter}
                onValueChange={(value) => setFilter(value as any)}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="pending">
                    Menunggu Review
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    Semua
                  </TabsTrigger>
                  <TabsTrigger value="action_taken">
                    Ditindaklanjuti
                  </TabsTrigger>
                  <TabsTrigger value="dismissed">
                    Diabaikan
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari laporan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                  <p className="text-gray-500">Memuat laporan...</p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Tidak ada laporan
                </h3>
                <p className="text-gray-500">
                  {filter === "pending"
                    ? "Tidak ada laporan yang menunggu review."
                    : filter === "all" && searchTerm
                      ? "Tidak ada laporan yang cocok dengan pencarian Anda."
                      : "Tidak ada laporan yang tersedia."}
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pelapor</TableHead>
                      <TableHead>Pengguna Dilaporkan</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={
                                  report.reporter?.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reporter_id}`
                                }
                                alt={report.reporter?.full_name || ""}
                              />
                              <AvatarFallback>
                                {report.reporter?.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">
                              {report.reporter?.full_name || "Pengguna"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={
                                  report.reported_user?.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reported_user_id}`
                                }
                                alt={report.reported_user?.full_name || ""}
                              />
                              <AvatarFallback>
                                {report.reported_user?.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">
                              {report.reported_user?.full_name || "Pengguna"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getReasonLabel(report.reason)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={showReportDetails} onOpenChange={setShowReportDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Laporan</DialogTitle>
            <DialogDescription>
              Review laporan pesan dan ambil tindakan yang sesuai.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-500" />
                    Informasi Pengguna
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Pelapor</p>
                      <div className="flex items-center mt-1">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage
                            src={
                              selectedReport.reporter?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReport.reporter_id}`
                            }
                            alt={selectedReport.reporter?.full_name || ""}
                          />
                          <AvatarFallback>
                            {selectedReport.reporter?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {selectedReport.reporter?.full_name || "Pengguna"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pengguna Dilaporkan</p>
                      <div className="flex items-center mt-1">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage
                            src={
                              selectedReport.reported_user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReport.reported_user_id}`
                            }
                            alt={selectedReport.reported_user?.full_name || ""}
                          />
                          <AvatarFallback>
                            {selectedReport.reported_user?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {selectedReport.reported_user?.full_name || "Pengguna"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Flag className="h-4 w-4 mr-1 text-gray-500" />
                    Detail Laporan
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Alasan Pelaporan</p>
                      <p className="font-medium">
                        {getReasonLabel(selectedReport.reason)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Laporan</p>
                      <p>
                        {new Date(selectedReport.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <div>{getStatusBadge(selectedReport.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                  Pesan yang Dilaporkan
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="prose prose-sm max-w-none">
                    <MessageRenderer content={selectedReport.message_content} />
                  </div>
                </div>
              </div>

              {selectedReport.additional_info && (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Informasi Tambahan dari Pelapor
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm">{selectedReport.additional_info}</p>
                  </div>
                </div>
              )}

              {selectedReport.status === "pending" && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Ambil Tindakan</h3>
                  <div className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Alasan pengambilan tindakan (wajib jika menghapus pesan)"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handleDismissReport}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Abaikan Laporan
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleTakeAction}
                        disabled={!actionReason || isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Hapus Pesan
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.status === "action_taken" && selectedReport.action_taken && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tindakan yang Diambil</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm">{selectedReport.action_taken}</p>
                    {selectedReport.reviewed_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Ditinjau pada{" "}
                        {new Date(selectedReport.reviewed_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDetails(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
