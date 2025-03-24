import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreVertical,
  Bookmark,
  BookmarkCheck,
  Flag,
  Share,
  Link as LinkIcon,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Pin,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { hasPrivilege } from "@/lib/reputation";
import { useToast } from "@/components/ui/use-toast";
import {
  bookmarkThread,
  unbookmarkThread,
  followThread,
  unfollowThread,
  reportContent,
  deleteThread,
  pinThread,
  unpinThread,
} from "@/lib/forum";

interface ThreadActionsProps {
  threadId: string;
  threadAuthorId: string;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  isPinned?: boolean;
  onActionComplete?: (action: string) => void;
}

export default function ThreadActions({
  threadId,
  threadAuthorId,
  isBookmarked = false,
  isFollowed = false,
  isPinned = false,
  onActionComplete,
}: ThreadActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [followed, setFollowed] = useState(isFollowed);
  const [pinned, setPinned] = useState(isPinned);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = user?.id === threadAuthorId;
  const isAdmin = user?.user_metadata?.role === "admin";

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menyimpan thread ini.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      if (bookmarked) {
        await unbookmarkThread(user.id, threadId);
        toast({
          title: "Bookmark Dihapus",
          description: "Thread telah dihapus dari bookmark.",
        });
      } else {
        await bookmarkThread(user.id, threadId);
        toast({
          title: "Thread Disimpan",
          description: "Thread telah ditambahkan ke bookmark.",
        });
      }
      setBookmarked(!bookmarked);
      onActionComplete?.("bookmark");
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan thread. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk mengikuti thread ini.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      if (followed) {
        await unfollowThread(user.id, threadId);
        toast({
          title: "Berhenti Mengikuti",
          description: "Anda tidak lagi mengikuti thread ini.",
        });
      } else {
        await followThread(user.id, threadId);
        toast({
          title: "Mengikuti Thread",
          description: "Anda akan menerima notifikasi untuk thread ini.",
        });
      }
      setFollowed(!followed);
      onActionComplete?.("follow");
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Gagal mengikuti thread. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handlePin = async () => {
    if (!isAdmin) return;

    try {
      if (pinned) {
        await unpinThread(threadId);
        toast({
          title: "Thread Tidak Dipin",
          description: "Thread tidak lagi dipin di kategori.",
        });
      } else {
        await pinThread(threadId);
        toast({
          title: "Thread Dipin",
          description: "Thread telah dipin di kategori.",
        });
      }
      setPinned(!pinned);
      onActionComplete?.("pin");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status pin thread. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Disalin",
      description: "Link thread telah disalin ke clipboard.",
    });
  };

  const handleReport = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk melaporkan thread ini.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // For high-priority flagging, check if user has the privilege (Level 5+)
    const { data: userData } = await supabase
      .from("users")
      .select("exp_points")
      .eq("id", user.id)
      .single();

    const userExp = userData?.exp_points || 0;
    const hasPriorityFlag = hasPrivilege(
      userExp,
      "Flag inappropriate content for immediate review",
    );

    if (!reportReason.trim()) {
      toast({
        title: "Alasan Diperlukan",
        description: "Silakan berikan alasan untuk laporan ini.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user exp to check for priority flagging privilege
      const { data: userData } = await supabase
        .from("users")
        .select("exp_points")
        .eq("id", user.id)
        .single();

      const userExp = userData?.exp_points || 0;
      const hasPriorityFlag = hasPrivilege(
        userExp,
        "Flag inappropriate content for immediate review",
      );

      await reportContent(
        user.id,
        threadId,
        undefined,
        reportReason,
        hasPriorityFlag,
      );
      setShowReportDialog(false);
      setReportReason("");
      toast({
        title: "Laporan Terkirim",
        description: hasPriorityFlag
          ? "Laporan Anda telah dikirim dengan prioritas tinggi dan akan segera ditinjau."
          : "Terima kasih atas laporan Anda. Tim kami akan meninjau konten ini.",
      });
      onActionComplete?.("report");
    } catch (error) {
      console.error("Error reporting thread:", error);
      toast({
        title: "Error",
        description: "Gagal mengirim laporan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor && !isAdmin) return;

    setIsSubmitting(true);
    try {
      await deleteThread(threadId);
      setShowDeleteDialog(false);
      toast({
        title: "Thread Dihapus",
        description: "Thread telah berhasil dihapus.",
      });
      navigate(-1);
      onActionComplete?.("delete");
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus thread. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
        >
          {bookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-1" />
              Tersimpan
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-1" />
              Simpan
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFollow}
          className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
        >
          {followed ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Berhenti Ikuti
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Ikuti
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
        >
          <Share className="h-4 w-4 mr-1" />
          Bagikan
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Salin Link
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Laporkan
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem onClick={handlePin}>
                <Pin className="h-4 w-4 mr-2" />
                {pinned ? "Lepas Pin" : "Pin Thread"}
              </DropdownMenuItem>
            )}

            {isAuthor && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(`/forum/edit-thread/${threadId}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Thread
                </DropdownMenuItem>
              </>
            )}

            {(isAuthor || isAdmin) && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4 mr-2" />
                Hapus Thread
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Laporkan Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Silakan berikan alasan mengapa Anda melaporkan thread ini. Laporan
              Anda akan ditinjau oleh moderator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Alasan laporan..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport} disabled={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus thread ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Thread"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
