// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { PrivateMessage } from "../../types/messages";
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
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import { Flag, Loader2 } from "lucide-react";

interface ReportMessageDialogProps {
  message: PrivateMessage;
  trigger: React.ReactNode;
}

const reportReasons = [
  {
    id: "inappropriate",
    label: "Konten tidak pantas",
    description: "Pesan mengandung konten yang tidak pantas atau menyinggung",
  },
  {
    id: "harassment",
    label: "Pelecehan atau intimidasi",
    description: "Pesan berisi pelecehan, intimidasi, atau ancaman",
  },
  {
    id: "spam",
    label: "Spam atau penipuan",
    description: "Pesan berisi spam, penipuan, atau tautan berbahaya",
  },
  {
    id: "personal_info",
    label: "Informasi pribadi",
    description: "Pesan mengungkapkan informasi pribadi tanpa izin",
  },
  {
    id: "other",
    label: "Alasan lain",
    description: "Alasan lain yang tidak tercantum di atas",
  },
];

export default function ReportMessageDialog({
  message,
  trigger,
}: ReportMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;

    try {
      setIsSubmitting(true);

      // Simpan laporan ke database
      const { error } = await supabase.from("message_reports").insert({
        message_id: message.id,
        reporter_id: user.id,
        reason,
        additional_info: additionalInfo,
        conversation_id: message.conversation_id,
        reported_user_id: message.sender_id,
        message_content: message.content,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Laporan Terkirim",
        description:
          "Terima kasih atas laporan Anda. Tim moderator kami akan meninjau pesan ini.",
      });

      setOpen(false);
      setReason("");
      setAdditionalInfo("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Gagal mengirim laporan. Silakan coba lagi.",
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
          <DialogTitle>Laporkan Pesan</DialogTitle>
          <DialogDescription>
            Laporkan pesan yang melanggar pedoman komunitas Sensasiwangi.
            Laporan Anda akan ditinjau oleh tim moderator kami.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Alasan Pelaporan</h4>
              <RadioGroup
                value={reason}
                onValueChange={setReason}
                className="space-y-2"
              >
                {reportReasons.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50"
                  >
                    <RadioGroupItem
                      value={item.id}
                      id={item.id}
                      className="mt-1"
                    />
                    <div className="grid gap-1">
                      <Label
                        htmlFor={item.id}
                        className="font-medium cursor-pointer"
                      >
                        {item.label}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="additional-info" className="text-sm font-medium">
                Informasi Tambahan (Opsional)
              </Label>
              <Textarea
                id="additional-info"
                placeholder="Berikan detail tambahan tentang mengapa Anda melaporkan pesan ini..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="mt-1"
              />
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
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Flag className="mr-2 h-4 w-4" />
                Kirim Laporan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


