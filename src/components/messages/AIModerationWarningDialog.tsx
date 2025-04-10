import React from "react";
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
import { AlertTriangle, Info, Shield, Bot } from "lucide-react";
import { ContentModerationResult } from "@/lib/ai-content-moderator";

interface AIModerationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  onCancel: () => void;
  moderationResult: ContentModerationResult | null;
  warningMessage: string;
}

export default function AIModerationWarningDialog({
  open,
  onOpenChange,
  onProceed,
  onCancel,
  moderationResult,
  warningMessage,
}: AIModerationWarningDialogProps) {
  // Fungsi untuk mendapatkan label kategori dalam bahasa Indonesia
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case "sexual":
        return "Konten seksual";
      case "sexual/minors":
        return "Konten seksual terkait anak";
      case "hate":
        return "Ujaran kebencian";
      case "hate/threatening":
        return "Ujaran kebencian yang mengancam";
      case "harassment":
        return "Pelecehan";
      case "harassment/threatening":
        return "Pelecehan yang mengancam";
      case "violence":
        return "Kekerasan";
      case "violence/graphic":
        return "Kekerasan grafis";
      case "self-harm":
        return "Menyakiti diri sendiri";
      case "self-harm/intent":
        return "Niat menyakiti diri sendiri";
      case "self-harm/instructions":
        return "Instruksi menyakiti diri sendiri";
      default:
        return category;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <Bot className="h-5 w-5 mr-2" />
            Peringatan Konten (AI)
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center">
                <Shield className="h-4 w-4 mr-1 text-red-600" />
                {warningMessage}
              </p>
              
              {moderationResult && moderationResult.categories.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-700">
                    Kategori terdeteksi:
                  </p>
                  <ul className="text-xs text-red-700 mt-1 list-disc pl-5">
                    {moderationResult.categories.map((category) => (
                      <li key={category}>
                        {getCategoryLabel(category)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p>
                  Sistem AI kami mendeteksi bahwa pesan Anda mungkin melanggar
                  pedoman komunitas Sensasiwangi.
                </p>
                <p className="mt-2">
                  Anda dapat mengedit pesan untuk menghapus konten yang tidak
                  sesuai, atau melanjutkan jika Anda yakin pesan Anda tidak
                  melanggar pedoman.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Metode moderasi: {moderationResult?.moderationMethod === "openai" 
                    ? "OpenAI Moderation API" 
                    : "Moderasi lokal"}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Edit Pesan
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-red-600 hover:bg-red-700"
          >
            Kirim Pesan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
