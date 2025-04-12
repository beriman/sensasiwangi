// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Ban, Loader2, AlertTriangle } from "lucide-react";

interface BlockUserDialogProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  trigger: React.ReactNode;
  onUserBlocked?: () => void;
}

export default function BlockUserDialog({
  userId,
  userName,
  userAvatar,
  trigger,
  onUserBlocked,
}: BlockUserDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlockUser = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Check if already blocked
      const { data: existingBlock, error: checkError } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingBlock) {
        toast({
          title: "Pengguna Sudah Diblokir",
          description: "Anda sudah memblokir pengguna ini sebelumnya.",
        });
        setOpen(false);
        return;
      }

      // Add to user_blocks table
      const { error: blockError } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason: reason || null,
      });

      if (blockError) throw blockError;

      toast({
        title: "Pengguna Diblokir",
        description: `Anda telah memblokir ${userName}. Anda tidak akan menerima pesan dari pengguna ini.`,
      });

      // Call the callback if provided
      if (onUserBlocked) {
        onUserBlocked();
      }

      setOpen(false);
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Gagal memblokir pengguna. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <Ban className="h-5 w-5 mr-2" />
            Blokir Pengguna
          </DialogTitle>
          <DialogDescription>
            Saat Anda memblokir seseorang, mereka tidak akan dapat mengirim
            pesan kepada Anda dan Anda tidak akan melihat pesan mereka di grup.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-md mb-4">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage
                src={
                  userAvatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
                }
                alt={userName}
              />
              <AvatarFallback>{userName[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-gray-500">
                Pengguna ini akan diblokir
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Penting untuk diketahui:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Pengguna yang diblokir tidak akan diberi tahu bahwa Anda
                      telah memblokir mereka
                    </li>
                    <li>
                      Anda masih akan melihat pesan mereka di grup, tetapi
                      mereka akan ditandai sebagai diblokir
                    </li>
                    <li>
                      Anda dapat membatalkan pemblokiran kapan saja melalui
                      pengaturan
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <label
              htmlFor="block-reason"
              className="text-sm font-medium block mb-1"
            >
              Alasan (Opsional)
            </label>
            <Textarea
              id="block-reason"
              placeholder="Mengapa Anda memblokir pengguna ini? (hanya untuk catatan Anda)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlockUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Blokir Pengguna
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


