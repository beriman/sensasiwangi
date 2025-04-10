import React, { useState } from "react";
import { useAuth } from "../../lib/auth-provider";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer, Loader2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SelfDestructMessageDialogProps {
  trigger: React.ReactNode;
  onConfirm: (expirationTime: number) => void;
}

export default function SelfDestructMessageDialog({
  trigger,
  onConfirm,
}: SelfDestructMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expirationTime, setExpirationTime] = useState("300"); // Default: 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableReadOnce, setEnableReadOnce] = useState(false);

  const handleConfirm = () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Convert expiration time to seconds
      const expirationSeconds = parseInt(expirationTime);
      
      // If read once is enabled, set expiration to -1 (special value)
      const finalExpiration = enableReadOnce ? -1 : expirationSeconds;

      // Call the onConfirm callback with the expiration time
      onConfirm(finalExpiration);

      // Show toast notification
      toast({
        title: "Pesan Sementara Diaktifkan",
        description: enableReadOnce
          ? "Pesan akan dihapus setelah dibaca."
          : `Pesan akan dihapus setelah ${formatTime(expirationSeconds)}.`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error setting self-destruct message:", error);
      toast({
        title: "Error",
        description: "Gagal mengaktifkan pesan sementara. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time in seconds to human-readable format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} detik`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} menit`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)} jam`;
    } else {
      return `${Math.floor(seconds / 86400)} hari`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Timer className="h-5 w-5 mr-2 text-amber-500" />
            Pesan Sementara
          </DialogTitle>
          <DialogDescription>
            Atur pesan Anda untuk dihapus secara otomatis setelah jangka waktu
            tertentu atau setelah dibaca.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="read-once" className="flex items-center">
                Hapus setelah dibaca
                <AlertTriangle className="h-4 w-4 ml-1 text-amber-500" />
              </Label>
              <Switch
                id="read-once"
                checked={enableReadOnce}
                onCheckedChange={setEnableReadOnce}
              />
            </div>

            {!enableReadOnce && (
              <div className="space-y-2">
                <Label htmlFor="expiration-time">Waktu kedaluwarsa</Label>
                <Select
                  value={expirationTime}
                  onValueChange={setExpirationTime}
                  disabled={enableReadOnce}
                >
                  <SelectTrigger id="expiration-time">
                    <SelectValue placeholder="Pilih waktu kedaluwarsa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 menit</SelectItem>
                    <SelectItem value="300">5 menit</SelectItem>
                    <SelectItem value="600">10 menit</SelectItem>
                    <SelectItem value="1800">30 menit</SelectItem>
                    <SelectItem value="3600">1 jam</SelectItem>
                    <SelectItem value="21600">6 jam</SelectItem>
                    <SelectItem value="86400">1 hari</SelectItem>
                    <SelectItem value="604800">1 minggu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Penting untuk diketahui:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Pesan sementara akan dihapus secara otomatis setelah waktu
                      yang ditentukan atau setelah dibaca
                    </li>
                    <li>
                      Pesan yang sudah dihapus tidak dapat dipulihkan
                    </li>
                    <li>
                      Penerima masih dapat mengambil screenshot atau menyalin
                      pesan sebelum dihapus
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
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Timer className="mr-2 h-4 w-4" />
                Aktifkan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
