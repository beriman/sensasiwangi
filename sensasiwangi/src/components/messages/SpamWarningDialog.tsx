// @ts-ignore
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
} from "../../components/ui/alert-dialog";
// @ts-ignore
import { AlertTriangle, Info, Shield } from "lucide-react";

interface SpamWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  onCancel: () => void;
  warningMessage: string;
}

export default function SpamWarningDialog({
  open,
  onOpenChange,
  onProceed,
  onCancel,
  warningMessage,
}: SpamWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Peringatan Spam
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center">
                <Shield className="h-4 w-4 mr-1 text-red-600" />
                {warningMessage}
              </p>
            </div>

            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p>
                  Untuk melindungi komunitas dari spam dan konten yang tidak
                  diinginkan, kami membatasi pesan yang terdeteksi sebagai spam.
                </p>
                <p className="mt-2">
                  Anda dapat mengedit pesan untuk menghapus konten spam, atau
                  melanjutkan jika Anda yakin pesan Anda bukan spam.
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


