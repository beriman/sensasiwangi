import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  checkPaymentStatus,
  simulatePaymentCallback,
} from "../../lib/qrPayment";

interface QRPaymentModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  invoiceNumber: string;
  qrCodeUrl: string;
  amount: number;
}

export default function QRPaymentModal({
  open,
  onClose,
  orderId,
  invoiceNumber,
  qrCodeUrl,
  amount,
}: QRPaymentModalProps) {
  const [status, setStatus] = useState<"pending" | "paid" | "failed">(
    "pending",
  );
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [isPolling, setIsPolling] = useState(true);

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Poll for payment status
  useEffect(() => {
    if (!open || !isPolling) return;

    const checkStatus = async () => {
      try {
        const data = await checkPaymentStatus(orderId);
        if (data?.status === "paid") {
          setStatus("paid");
          setIsPolling(false);
        } else if (data?.status === "failed") {
          setStatus("failed");
          setIsPolling(false);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [open, orderId, isPolling]);

  // Countdown timer
  useEffect(() => {
    if (!open || !isPolling) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPolling(false);
          setStatus("failed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, isPolling]);

  // For demo purposes only - simulate payment
  const handleSimulatePayment = async (success: boolean) => {
    try {
      await simulatePaymentCallback(
        invoiceNumber,
        success ? "paid" : "failed",
        amount,
      );
      setStatus(success ? "paid" : "failed");
      setIsPolling(false);
    } catch (error) {
      console.error("Error simulating payment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran QRIS</DialogTitle>
          <DialogDescription>
            Scan QR code di bawah ini untuk melakukan pembayaran
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {status === "pending" && (
            <>
              <div className="border rounded-lg p-4 bg-white">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Pembayaran"
                  className="w-64 h-64"
                />
              </div>

              <div className="text-center">
                <p className="font-medium">Total Pembayaran</p>
                <p className="text-2xl font-bold">
                  Rp {amount.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Invoice: {invoiceNumber}
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Waktu tersisa</span>
                  <span className="font-medium">{formatTimeLeft()}</span>
                </div>
                <Progress value={(timeLeft / 900) * 100} className="h-2" />
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Silakan scan QR code di atas menggunakan aplikasi e-wallet atau
                mobile banking Anda
              </p>
            </>
          )}

          {status === "paid" && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-bold">Pembayaran Berhasil!</h3>
                <p className="text-muted-foreground">
                  Terima kasih atas pembayaran Anda. Pesanan Anda sedang
                  diproses.
                </p>
              </div>
              <Button onClick={onClose} className="mt-4">
                Kembali ke Pesanan
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center space-y-4 py-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-xl font-bold">Pembayaran Gagal</h3>
                <p className="text-muted-foreground">
                  Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi
                  atau gunakan metode pembayaran lain.
                </p>
              </div>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    setStatus("pending");
                    setTimeLeft(900);
                    setIsPolling(true);
                  }}
                >
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}

          {/* Demo controls - remove in production */}
          {process.env.NODE_ENV === "development" && status === "pending" && (
            <div className="border-t pt-4 w-full">
              <p className="text-sm font-medium mb-2">Demo Controls:</p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSimulatePayment(true)}
                >
                  Simulate Success
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSimulatePayment(false)}
                >
                  Simulate Failure
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
