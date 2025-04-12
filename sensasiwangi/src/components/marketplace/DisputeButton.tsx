// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
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
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { AlertTriangle } from "lucide-react";
// @ts-ignore
import { createDispute } from "../../lib/dispute";

interface DisputeButtonProps {
  transactionId: string;
  productName: string;
  disabled?: boolean;
  onDisputeCreated?: () => void;
  className?: string;
}

const DisputeButton = ({
  transactionId,
  productName,
  disabled = false,
  onDisputeCreated,
  className = "",
}: DisputeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Silakan berikan alasan untuk pengajuan sengketa.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createDispute(transactionId, reason);
      toast({
        title: "Berhasil",
        description:
          "Pengajuan sengketa telah dikirim. Admin akan meninjau kasus Anda.",
      });
      setIsOpen(false);
      setReason("");
      if (onDisputeCreated) {
        onDisputeCreated();
      }
    } catch (error) {
      console.error("Error creating dispute:", error);
      toast({
        title: "Error",
        description: "Gagal mengajukan sengketa. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`text-amber-600 border-amber-200 hover:bg-amber-50 ${className}`}
          disabled={disabled}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Ajukan Sengketa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajukan Sengketa</DialogTitle>
          <DialogDescription>
            Ajukan sengketa untuk transaksi produk{" "}
            <strong>{productName}</strong>. Berikan alasan yang jelas mengapa
            Anda mengajukan sengketa ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Jelaskan alasan Anda mengajukan sengketa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
            <p className="text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Pengajuan sengketa akan ditinjau oleh admin. Pastikan Anda
              memberikan alasan yang jelas dan valid.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? "Mengirim..." : "Ajukan Sengketa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeButton;


