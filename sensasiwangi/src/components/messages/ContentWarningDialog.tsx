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
import { AlertTriangle, Info, Shield } from "lucide-react";

interface ContentWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  onCancel: () => void;
  hasBadWords: boolean;
  hasPII: boolean;
  badWords: string[];
  piiTypes: string[];
}

export default function ContentWarningDialog({
  open,
  onOpenChange,
  onProceed,
  onCancel,
  hasBadWords,
  hasPII,
  badWords,
  piiTypes,
}: ContentWarningDialogProps) {
  // Fungsi untuk mendapatkan label jenis PII dalam bahasa Indonesia
  const getPIITypeLabel = (type: string): string => {
    switch (type) {
      case "email":
        return "alamat email";
      case "phone":
        return "nomor telepon";
      case "nik":
        return "nomor NIK";
      case "creditCard":
        return "nomor kartu kredit";
      case "address":
        return "alamat";
      default:
        return type;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-amber-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Peringatan Konten
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800 font-medium">
                Pesan Anda terdeteksi mengandung konten yang tidak sesuai dengan
                pedoman komunitas Sensasiwangi:
              </p>

              {hasBadWords && (
                <div className="mt-2">
                  <p className="text-sm text-amber-800 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-amber-600" />
                    Kata-kata kasar atau tidak pantas
                  </p>
                  {badWords.length > 0 && (
                    <p className="text-xs text-amber-700 mt-1 ml-5">
                      Terdeteksi: {badWords.map(word => `"${word}"`).join(", ")}
                    </p>
                  )}
                </div>
              )}

              {hasPII && (
                <div className="mt-2">
                  <p className="text-sm text-amber-800 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-amber-600" />
                    Informasi pribadi
                  </p>
                  {piiTypes.length > 0 && (
                    <p className="text-xs text-amber-700 mt-1 ml-5">
                      Terdeteksi: {piiTypes.map(type => getPIITypeLabel(type)).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p>
                  Untuk melindungi privasi dan menjaga komunikasi yang sehat,
                  kami tidak mengizinkan pengiriman informasi pribadi atau
                  penggunaan kata-kata kasar.
                </p>
                <p className="mt-2">
                  Anda dapat mengedit pesan untuk menghapus konten yang tidak
                  sesuai, atau melanjutkan dengan pesan yang akan disensor
                  secara otomatis.
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
            className="bg-amber-600 hover:bg-amber-700"
          >
            Kirim dengan Sensor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
