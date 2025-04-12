// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
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
  Mail,
  MailX,
  Smile,
} from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { hasPrivilege } from "../../lib/reputation";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  bookmarkThread,
  unbookmarkThread,
  followThread,
  unfollowThread,
  reportContent,
  deleteThread,
  pinThread,
  unpinThread,
  toggleThreadEmailNotifications,
  addThreadReaction,
  getThreadReactions,
} from "../../lib/forum";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

interface ThreadActionsProps {
  threadId: string;
  threadAuthorId: string;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  isPinned?: boolean;
  emailNotifications?: boolean;
  reactions?: Record<string, number>;
  userReactions?: string[];
  onActionComplete?: (action: string) => void;
}

export default function ThreadActions({
  threadId,
  threadAuthorId,
  isBookmarked = false,
  isFollowed = false,
  isPinned = false,
  emailNotifications = false,
  reactions = {},
  userReactions = [],
  onActionComplete,
}: ThreadActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [followed, setFollowed] = useState(isFollowed);
  const [emailNotify, setEmailNotify] = useState(emailNotifications);
  const [pinned, setPinned] = useState(isPinned);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadReactions, setThreadReactions] =
    useState<Record<string, number>>(reactions);
  const [userThreadReactions, setUserThreadReactions] =
    useState<string[]>(userReactions);
  const [showReactionPopover, setShowReactionPopover] = useState(false);

  // Common emoji reactions
  const commonEmojis = ["👍", "👎", "❤️", "😂", "😮", "😢", "🔥", "👏"];

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
        setEmailNotify(false);
      } else {
        await followThread(user.id, threadId, true);
        toast({
          title: "Mengikuti Thread",
          description: "Anda akan menerima notifikasi untuk thread ini.",
        });
        setEmailNotify(true);
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

  const handleToggleEmailNotifications = async () => {
    if (!user || !followed) return;

    try {
      await toggleThreadEmailNotifications(user.id, threadId, !emailNotify);
      setEmailNotify(!emailNotify);
      toast({
        title: emailNotify
          ? "Notifikasi Email Dinonaktifkan"
          : "Notifikasi Email Diaktifkan",
        description: emailNotify
          ? "Anda tidak akan menerima email untuk thread ini."
          : "Anda akan menerima email saat ada balasan baru.",
      });
      onActionComplete?.("email_notifications");
    } catch (error) {
      console.error("Error toggling email notifications:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah pengaturan notifikasi. Silakan coba lagi.",
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
        description: "Gagal melaporkan thread. Silakan coba lagi.",
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
      toast({
        title: "Thread Dihapus",
        description: "Thread telah berhasil dihapus.",
      });
      onActionComplete?.("delete");
      // Navigate back to forum
      navigate("/forum");
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus thread. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk memberikan reaksi.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await addThreadReaction(user.id, threadId, emoji);

      // Update local state for immediate feedback
      const newUserReactions = [...userThreadReactions];
      const emojiIndex = newUserReactions.indexOf(emoji);

      if (emojiIndex >= 0) {
        // User already reacted with this emoji, remove it
        newUserReactions.splice(emojiIndex, 1);
        setThreadReactions({
          ...threadReactions,
          [emoji]: Math.max(0, (threadReactions[emoji] || 0) - 1),
        });
      } else {
        // Add new reaction
        newUserReactions.push(emoji);
        setThreadReactions({
          ...threadReactions,
          [emoji]: (threadReactions[emoji] || 0) + 1,
        });
      }

      setUserThreadReactions(newUserReactions);
      setShowReactionPopover(false);
      onActionComplete?.("reaction");
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan reaksi. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  // Load reactions when component mounts
  React.useEffect(() => {
    if (threadId && user) {
      const loadReactions = async () => {
        try {
          const { reactions, userReactions } = await getThreadReactions(
            threadId,
            user.id,
          );
          setThreadReactions(reactions);
          setUserThreadReactions(userReactions);
        } catch (error) {
          console.error("Error loading reactions:", error);
        }
      };

      loadReactions();
    }
  }, [threadId, user]);

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Reaction Button */}
        <Popover
          open={showReactionPopover}
          onOpenChange={setShowReactionPopover}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Smile className="h-5 w-5" />
              {Object.keys(threadReactions).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {Object.values(threadReactions).reduce(
                    (sum, count) => sum + count,
                    0,
                  )}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {commonEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant={
                    userThreadReactions.includes(emoji) ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleReaction(emoji)}
                >
                  <span className="text-lg">{emoji}</span>
                  {threadReactions[emoji] && threadReactions[emoji] > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-muted text-muted-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {threadReactions[emoji]}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Reaction Display */}
        {Object.keys(threadReactions).length > 0 && (
          <div className="flex items-center space-x-1 bg-muted rounded-full px-2 py-1">
            {Object.entries(threadReactions)
              .filter(([_, count]) => count > 0)
              .slice(0, 3)
              .map(([emoji, count]) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-1 rounded-full ${userThreadReactions.includes(emoji) ? "bg-primary/20" : ""}`}
                  onClick={() => handleReaction(emoji)}
                >
                  <span className="mr-1">{emoji}</span>
                  <span className="text-xs">{count}</span>
                </Button>
              ))}
            {Object.keys(threadReactions).filter(
              (emoji) => threadReactions[emoji] > 0,
            ).length > 3 && (
              <span className="text-xs text-muted-foreground">
                +
                {Object.keys(threadReactions).filter(
                  (emoji) => threadReactions[emoji] > 0,
                ).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleBookmark}>
              {bookmarked ? (
                <>
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                  <span>Hapus Bookmark</span>
                </>
              ) : (
                <>
                  <Bookmark className="mr-2 h-4 w-4" />
                  <span>Bookmark Thread</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFollow}>
              {followed ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  <span>Berhenti Mengikuti</span>
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Ikuti Thread</span>
                </>
              )}
            </DropdownMenuItem>
            {followed && (
              <DropdownMenuItem onClick={handleToggleEmailNotifications}>
                {emailNotify ? (
                  <>
                    <MailX className="mr-2 h-4 w-4" />
                    <span>Nonaktifkan Email</span>
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Aktifkan Email</span>
                  </>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShare}>
              <LinkIcon className="mr-2 h-4 w-4" />
              <span>Salin Link</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowReportDialog(true)}
              className="text-amber-600"
            >
              <Flag className="mr-2 h-4 w-4" />
              <span>Laporkan Thread</span>
            </DropdownMenuItem>
            {(isAuthor || isAdmin) && (
              <>
                <DropdownMenuSeparator />
                {isAuthor && (
                  <DropdownMenuItem asChild>
                    <Link
                      to={`/forum/edit/${threadId}`}
                      className="flex items-center text-blue-600 hover:bg-blue-50 w-full px-2 py-1.5 rounded-sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Thread</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Hapus Thread</span>
                </DropdownMenuItem>
              </>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePin}>
                  <Pin className="mr-2 h-4 w-4" />
                  <span>{pinned ? "Unpin Thread" : "Pin Thread"}</span>
                </DropdownMenuItem>
              </>
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
              akan ditinjau oleh moderator kami.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Alasan laporan..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReport}
              disabled={isSubmitting || !reportReason.trim()}
            >
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
              dapat dibatalkan dan semua balasan akan ikut terhapus.
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


