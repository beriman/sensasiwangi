import React, { useState } from "react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { PrivateMessage } from "@/types/messages";
import { useConversation } from "@/contexts/ConversationContext";
import { useToast } from "@/components/ui/use-toast";
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
import {
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Trash2,
  Edit,
  CornerUpLeft,
  Flag,
} from "lucide-react";
import ReportMessageDialog from "./ReportMessageDialog";
import BlockUserDialog from "./BlockUserDialog";
import ForwardMessageDialog from "./ForwardMessageDialog";

interface MessageActionsProps {
  message: PrivateMessage;
  isOwnMessage: boolean;
}

export default function MessageActions({
  message,
  isOwnMessage,
}: MessageActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setReplyToMessage, setEditingMessage } = useConversation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyText = () => {
    // Extract plain text from HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = message.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(textContent).then(
      () => {
        toast({
          title: "Teks Disalin",
          description: "Teks pesan telah disalin ke clipboard.",
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Gagal Menyalin",
          description: "Tidak dapat menyalin teks pesan.",
          variant: "destructive",
        });
      }
    );
  };

  const handleReply = () => {
    setReplyToMessage(message);
  };

  const handleEdit = () => {
    if (!isOwnMessage) return;
    setEditingMessage(message);
  };

  const handleDelete = async () => {
    if (!user || !isOwnMessage) return;

    try {
      setIsDeleting(true);

      // Update the message content to show it was deleted
      const { error } = await supabase
        .from("private_messages")
        .update({
          content: "<p><em>Pesan ini telah dihapus</em></p>",
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", message.id)
        .eq("sender_id", user.id);

      if (error) throw error;

      toast({
        title: "Pesan Dihapus",
        description: "Pesan Anda telah berhasil dihapus.",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Check if message is already deleted
  const isDeleted = message.is_deleted;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleReply}>
            <Reply className="h-4 w-4 mr-2" />
            Balas
          </DropdownMenuItem>

          {!isDeleted && (
            <DropdownMenuItem asChild>
              <ForwardMessageDialog
                message={message}
                trigger={
                  <div className="flex items-center cursor-pointer w-full">
                    <Forward className="h-4 w-4 mr-2" />
                    Teruskan
                  </div>
                }
              />
            </DropdownMenuItem>
          )}

          {!isDeleted && (
            <DropdownMenuItem onClick={handleCopyText}>
              <Copy className="h-4 w-4 mr-2" />
              Salin Teks
            </DropdownMenuItem>
          )}

          {/* Report option - always available for other users' messages */}
          {!isOwnMessage && (
            <>
              <DropdownMenuItem asChild>
                <ReportMessageDialog
                  message={message}
                  trigger={
                    <div className="flex items-center cursor-pointer w-full text-red-600">
                      <Flag className="h-4 w-4 mr-2" />
                      Laporkan
                    </div>
                  }
                />
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <BlockUserDialog
                  userId={message.sender_id}
                  userName={message.sender?.full_name || "Pengguna"}
                  userAvatar={message.sender?.avatar_url}
                  trigger={
                    <div className="flex items-center cursor-pointer w-full text-red-600">
                      <Ban className="h-4 w-4 mr-2" />
                      Blokir Pengguna
                    </div>
                  }
                />
              </DropdownMenuItem>
            </>
          )}

          {isOwnMessage && !isDeleted && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
