import React, { useState } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Loader2,
  Lock,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PrivateMessage, PrivateConversation } from "@/types/messages";

interface ChatExportDialogProps {
  trigger: React.ReactNode;
  conversationId: string;
  conversationTitle: string;
}

export default function ChatExportDialog({
  trigger,
  conversationId,
  conversationTitle,
}: ChatExportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "txt" | "html">("json");
  const [includeMedia, setIncludeMedia] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "30days" | "90days" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleExport = async () => {
    if (!user) return;

    // Validate password if encryption is enabled
    if (password) {
      if (password.length < 8) {
        setPasswordError("Kata sandi harus minimal 8 karakter");
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("Kata sandi tidak cocok");
        return;
      }

      setPasswordError("");
    }

    try {
      setIsExporting(true);

      // Fetch conversation details
      const { data: conversationData, error: conversationError } = await supabase
        .from("private_conversations")
        .select("*, participants:private_conversation_participants(user_id, user:users(full_name, email))")
        .eq("id", conversationId)
        .single();

      if (conversationError) throw conversationError;

      // Prepare date filters
      let dateFilter = {};
      const now = new Date();
      
      if (dateRange === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        dateFilter = { created_at: { gte: thirtyDaysAgo.toISOString() } };
      } else if (dateRange === "90days") {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        dateFilter = { created_at: { gte: ninetyDaysAgo.toISOString() } };
      } else if (dateRange === "custom" && startDate) {
        dateFilter = { 
          created_at: { 
            gte: new Date(startDate).toISOString(),
            ...(endDate && { lte: new Date(endDate).toISOString() })
          } 
        };
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("private_messages")
        .select("*, sender:sender_id(full_name, email)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .match(dateFilter);

      if (messagesError) throw messagesError;

      // Prepare export data
      const exportData = {
        conversation: {
          id: conversationId,
          title: conversationTitle || "Private Conversation",
          is_group: conversationData.is_group,
          created_at: conversationData.created_at,
          participants: conversationData.participants,
        },
        messages: messagesData.map(message => ({
          id: message.id,
          sender: message.sender,
          content: message.content,
          created_at: message.created_at,
          has_image: !!message.image_url,
          is_deleted: message.is_deleted,
        })),
        export_info: {
          exported_by: user.user_metadata?.full_name || user.email,
          exported_at: new Date().toISOString(),
          export_format: exportFormat,
          include_media: includeMedia,
          is_encrypted: !!password,
        },
      };

      // Format data based on selected format
      let formattedData: string;
      let fileName: string;
      let mimeType: string;

      if (exportFormat === "json") {
        formattedData = JSON.stringify(exportData, null, 2);
        fileName = `chat_${conversationId}_${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else if (exportFormat === "txt") {
        formattedData = formatAsTxt(exportData);
        fileName = `chat_${conversationId}_${new Date().toISOString().split("T")[0]}.txt`;
        mimeType = "text/plain";
      } else {
        // HTML format
        formattedData = formatAsHtml(exportData);
        fileName = `chat_${conversationId}_${new Date().toISOString().split("T")[0]}.html`;
        mimeType = "text/html";
      }

      // Encrypt data if password is provided
      if (password) {
        formattedData = await encryptData(formattedData, password);
        fileName = `encrypted_${fileName}`;
      }

      // Create and download file
      const blob = new Blob([formattedData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Ekspor Berhasil",
        description: `Riwayat chat telah diekspor ke ${fileName}`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error exporting chat:", error);
      toast({
        title: "Error",
        description: "Gagal mengekspor riwayat chat. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Format data as plain text
  const formatAsTxt = (data: any): string => {
    const { conversation, messages, export_info } = data;
    
    let txt = `RIWAYAT CHAT: ${conversation.title}\n`;
    txt += `Diekspor oleh: ${export_info.exported_by} pada ${new Date(export_info.exported_at).toLocaleString("id-ID")}\n`;
    txt += `${conversation.is_group ? "Grup" : "Percakapan Pribadi"}\n`;
    txt += `Peserta: ${conversation.participants.map((p: any) => p.user.full_name || p.user.email).join(", ")}\n`;
    txt += `\n${"=".repeat(50)}\n\n`;
    
    messages.forEach((message: any) => {
      const sender = message.sender?.full_name || message.sender?.email || "Unknown";
      const date = new Date(message.created_at).toLocaleString("id-ID");
      
      txt += `[${date}] ${sender}:\n`;
      
      if (message.is_deleted) {
        txt += "<Pesan ini telah dihapus>\n";
      } else {
        // Strip HTML tags for plain text
        const content = message.content.replace(/<[^>]*>?/gm, "");
        txt += `${content}\n`;
        
        if (message.has_image) {
          txt += "[Gambar]\n";
        }
      }
      
      txt += "\n";
    });
    
    return txt;
  };

  // Format data as HTML
  const formatAsHtml = (data: any): string => {
    const { conversation, messages, export_info } = data;
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Riwayat Chat: ${conversation.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .message { margin-bottom: 15px; }
    .message-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .sender { font-weight: bold; }
    .timestamp { color: #666; font-size: 0.8em; }
    .content { background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #eee; }
    .deleted { font-style: italic; color: #999; }
    .image-placeholder { background: #eee; padding: 10px; border-radius: 5px; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Riwayat Chat: ${conversation.title}</h1>
    <p>Diekspor oleh: ${export_info.exported_by} pada ${new Date(export_info.exported_at).toLocaleString("id-ID")}</p>
    <p>${conversation.is_group ? "Grup" : "Percakapan Pribadi"}</p>
    <p>Peserta: ${conversation.participants.map((p: any) => p.user.full_name || p.user.email).join(", ")}</p>
  </div>
  <div class="messages">`;
    
    messages.forEach((message: any) => {
      const sender = message.sender?.full_name || message.sender?.email || "Unknown";
      const date = new Date(message.created_at).toLocaleString("id-ID");
      
      html += `
    <div class="message">
      <div class="message-header">
        <span class="sender">${sender}</span>
        <span class="timestamp">${date}</span>
      </div>
      <div class="content">`;
      
      if (message.is_deleted) {
        html += `<p class="deleted">&lt;Pesan ini telah dihapus&gt;</p>`;
      } else {
        html += message.content;
        
        if (message.has_image) {
          html += `<div class="image-placeholder">[Gambar]</div>`;
        }
      }
      
      html += `
      </div>
    </div>`;
    });
    
    html += `
  </div>
</body>
</html>`;
    
    return html;
  };

  // Encrypt data with password
  const encryptData = async (data: string, password: string): Promise<string> => {
    // Convert password to key using PBKDF2
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Encrypt data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(data)
    );
    
    // Combine salt, iv, and encrypted data
    const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    encryptedArray.set(salt, 0);
    encryptedArray.set(iv, salt.length);
    encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...encryptedArray));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2 text-blue-600" />
            Ekspor Riwayat Chat
          </DialogTitle>
          <DialogDescription>
            Ekspor riwayat chat Anda untuk cadangan atau arsip. Anda dapat
            mengenkripsi ekspor dengan kata sandi untuk keamanan tambahan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format Ekspor</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as any)}
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Pilih format ekspor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      JSON (untuk backup)
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-green-600" />
                      Teks (mudah dibaca)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-purple-600" />
                      HTML (format terstruktur)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Rentang Waktu</Label>
              <Select
                value={dateRange}
                onValueChange={(value) => setDateRange(value as any)}
              >
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Pilih rentang waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Semua pesan
                    </div>
                  </SelectItem>
                  <SelectItem value="30days">30 hari terakhir</SelectItem>
                  <SelectItem value="90days">90 hari terakhir</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Tanggal Mulai</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Tanggal Akhir</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-media"
                checked={includeMedia}
                onCheckedChange={(checked) => setIncludeMedia(checked as boolean)}
              />
              <Label htmlFor="include-media" className="text-sm">
                Sertakan tautan media (gambar)
              </Label>
            </div>

            <div className="space-y-2 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="encrypt" className="text-sm font-medium">
                  Enkripsi dengan Kata Sandi
                </Label>
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <Input
                id="encrypt"
                type="password"
                placeholder="Kata sandi (opsional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && (
                <Input
                  type="password"
                  placeholder="Konfirmasi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
              <p className="text-xs text-gray-500">
                Jika Anda mengenkripsi ekspor, Anda akan memerlukan kata sandi
                ini untuk membukanya nanti.
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Penting untuk diketahui:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Ekspor ini mungkin berisi informasi pribadi dan sensitif
                    </li>
                    <li>
                      Simpan file ekspor di tempat yang aman dan jangan
                      bagikan dengan orang lain
                    </li>
                    <li>
                      Jika Anda mengenkripsi ekspor, simpan kata sandi dengan
                      aman. Kami tidak dapat memulihkan kata sandi yang hilang.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (dateRange === "custom" && !startDate)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengekspor...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Ekspor Chat
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
