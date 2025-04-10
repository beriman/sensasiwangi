import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Shield,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Ban,
  Eye,
  FileText,
  Download,
  Calendar,
  User,
  Lock,
  Camera,
  Link,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Types for security audit logs
interface SecurityAuditLog {
  id: string;
  event_type: string;
  user_id: string;
  target_id?: string;
  target_type?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export default function SecurityAuditLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const PAGE_SIZE = 20;

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

      fetchAuditLogs();
    };

    checkAdmin();
  }, [user, toast, page, eventTypeFilter, severityFilter, dateFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      // Prepare filters
      let query = supabase
        .from("security_audit_logs")
        .select(
          `*, user:user_id(full_name, email, avatar_url)`,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      // Apply event type filter
      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }

      // Apply severity filter
      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        if (dateFilter === "today") {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === "yesterday") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === "week") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateFilter === "month") {
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
        }

        query = query.gte("created_at", startDate!.toISOString());
      }

      // Apply search term
      if (searchTerm) {
        query = query.or(
          `user_id.ilike.%${searchTerm}%,target_id.ilike.%${searchTerm}%,event_type.ilike.%${searchTerm}%,details.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Gagal memuat log audit keamanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log: SecurityAuditLog) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const handleExportLogs = async () => {
    try {
      setIsExporting(true);

      // Fetch all logs with current filters
      let query = supabase
        .from("security_audit_logs")
        .select(`*, user:user_id(full_name, email)`)
        .order("created_at", { ascending: false });

      // Apply event type filter
      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }

      // Apply severity filter
      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        if (dateFilter === "today") {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === "yesterday") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === "week") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateFilter === "month") {
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
        }

        query = query.gte("created_at", startDate!.toISOString());
      }

      // Apply search term
      if (searchTerm) {
        query = query.or(
          `user_id.ilike.%${searchTerm}%,target_id.ilike.%${searchTerm}%,event_type.ilike.%${searchTerm}%,details.ilike.%${searchTerm}%`
        );
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      // Format data for export
      const exportData = data?.map((log) => ({
        id: log.id,
        event_type: log.event_type,
        user: log.user?.full_name || log.user?.email || log.user_id,
        target_type: log.target_type || "",
        target_id: log.target_id || "",
        severity: log.severity,
        ip_address: log.ip_address || "",
        user_agent: log.user_agent || "",
        details: log.details ? JSON.stringify(log.details) : "",
        created_at: new Date(log.created_at).toLocaleString("id-ID"),
      }));

      // Convert to CSV
      const headers = [
        "ID",
        "Event Type",
        "User",
        "Target Type",
        "Target ID",
        "Severity",
        "IP Address",
        "User Agent",
        "Details",
        "Created At",
      ];

      const csvContent =
        headers.join(",") +
        "\n" +
        exportData
          ?.map((row) =>
            Object.values(row)
              .map((value) => `"${value}"`)
              .join(",")
          )
          .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security_audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Ekspor Berhasil",
        description: "Log audit keamanan telah diekspor ke CSV.",
      });
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast({
        title: "Error",
        description: "Gagal mengekspor log audit keamanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "login_success":
      case "login_failure":
        return <User className="h-4 w-4 text-blue-500" />;
      case "message_reported":
      case "report_reviewed":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "user_blocked":
      case "user_unblocked":
        return <Ban className="h-4 w-4 text-red-500" />;
      case "message_deleted":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "encryption_enabled":
      case "encryption_disabled":
        return <Lock className="h-4 w-4 text-green-500" />;
      case "screenshot_detected":
        return <Camera className="h-4 w-4 text-purple-500" />;
      case "malicious_link_detected":
        return <Link className="h-4 w-4 text-red-500" />;
      case "chat_exported":
        return <Download className="h-4 w-4 text-blue-500" />;
      case "identity_verified":
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Rendah
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Sedang
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Tinggi
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Kritis
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {severity}
          </Badge>
        );
    }
  };

  // Get event type label
  const getEventTypeLabel = (eventType: string): string => {
    switch (eventType) {
      case "login_success":
        return "Login Berhasil";
      case "login_failure":
        return "Login Gagal";
      case "message_reported":
        return "Pesan Dilaporkan";
      case "report_reviewed":
        return "Laporan Ditinjau";
      case "user_blocked":
        return "Pengguna Diblokir";
      case "user_unblocked":
        return "Blokir Pengguna Dihapus";
      case "message_deleted":
        return "Pesan Dihapus";
      case "encryption_enabled":
        return "Enkripsi Diaktifkan";
      case "encryption_disabled":
        return "Enkripsi Dinonaktifkan";
      case "screenshot_detected":
        return "Screenshot Terdeteksi";
      case "malicious_link_detected":
        return "Tautan Berbahaya Terdeteksi";
      case "chat_exported":
        return "Chat Diekspor";
      case "identity_verified":
        return "Identitas Diverifikasi";
      default:
        return eventType.replace(/_/g, " ");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="h-6 w-6 mr-2 text-purple-600" />
          Log Audit Keamanan
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={loading || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Ekspor CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
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
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div>
              <Select
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipe Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="login_success">Login Berhasil</SelectItem>
                  <SelectItem value="login_failure">Login Gagal</SelectItem>
                  <SelectItem value="message_reported">Pesan Dilaporkan</SelectItem>
                  <SelectItem value="report_reviewed">Laporan Ditinjau</SelectItem>
                  <SelectItem value="user_blocked">Pengguna Diblokir</SelectItem>
                  <SelectItem value="message_deleted">Pesan Dihapus</SelectItem>
                  <SelectItem value="encryption_enabled">Enkripsi Diaktifkan</SelectItem>
                  <SelectItem value="screenshot_detected">Screenshot Terdeteksi</SelectItem>
                  <SelectItem value="malicious_link_detected">Tautan Berbahaya</SelectItem>
                  <SelectItem value="chat_exported">Chat Diekspor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={severityFilter}
                onValueChange={setSeverityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tingkat Keparahan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="critical">Kritis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={dateFilter}
                onValueChange={setDateFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanggal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">30 Hari Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
            <p className="text-gray-500">Memuat log audit keamanan...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Tidak ada log
          </h3>
          <p className="text-gray-500">
            Tidak ada log audit keamanan yang cocok dengan filter Anda.
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Keparahan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getEventTypeIcon(log.event_type)}
                        <span className="ml-2">{getEventTypeLabel(log.event_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage
                            src={
                              log.user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`
                            }
                            alt={log.user?.full_name || ""}
                          />
                          <AvatarFallback>
                            {log.user?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[100px]">
                          {log.user?.full_name || log.user?.email || log.user_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.target_type && log.target_id ? (
                        <span className="text-sm">
                          {log.target_type}: {log.target_id.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(log.severity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLog(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setPage(pageNumber)}
                        isActive={pageNumber === page}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Log Audit</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang event keamanan.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    Informasi Event
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">ID Event</p>
                      <p className="font-mono text-sm">{selectedLog.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tipe Event</p>
                      <div className="flex items-center">
                        {getEventTypeIcon(selectedLog.event_type)}
                        <p className="font-medium ml-2">
                          {getEventTypeLabel(selectedLog.event_type)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Waktu</p>
                      <p>
                        {new Date(selectedLog.created_at).toLocaleString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Keparahan</p>
                      <div>{getSeverityBadge(selectedLog.severity)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-500" />
                    Informasi Pengguna
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage
                          src={
                            selectedLog.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLog.user_id}`
                          }
                          alt={selectedLog.user?.full_name || ""}
                        />
                        <AvatarFallback>
                          {selectedLog.user?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedLog.user?.full_name || "Pengguna"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedLog.user?.email || selectedLog.user_id}
                        </p>
                      </div>
                    </div>
                    {selectedLog.ip_address && (
                      <div>
                        <p className="text-xs text-gray-500">Alamat IP</p>
                        <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                      </div>
                    )}
                    {selectedLog.user_agent && (
                      <div>
                        <p className="text-xs text-gray-500">User Agent</p>
                        <p className="text-sm truncate">
                          {selectedLog.user_agent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(selectedLog.target_type || selectedLog.target_id) && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-gray-500" />
                    Target
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLog.target_type && (
                        <div>
                          <p className="text-xs text-gray-500">Tipe Target</p>
                          <p className="font-medium">{selectedLog.target_type}</p>
                        </div>
                      )}
                      {selectedLog.target_id && (
                        <div>
                          <p className="text-xs text-gray-500">ID Target</p>
                          <p className="font-mono">{selectedLog.target_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-gray-500" />
                    Detail Tambahan
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-xs overflow-auto max-h-40 font-mono">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogDetails(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
