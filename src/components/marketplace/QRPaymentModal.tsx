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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
} from "lucide-react";
import {
  checkPaymentStatus,
  simulatePaymentCallback,
  PaymentMethod,
} from "../../lib/qrPayment";
import { useToast } from "../ui/use-toast";

interface QRPaymentModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  invoiceNumber: string;
  qrCodeUrl: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  expiryTime?: string;
  transactionId?: string;
}

export default function QRPaymentModal({
  open,
  onClose,
  orderId,
  invoiceNumber,
  qrCodeUrl,
  amount,
  paymentMethod = "QRIS",
  expiryTime,
  transactionId,
}: QRPaymentModalProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "paid" | "failed">(
    "pending",
  );
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [isPolling, setIsPolling] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Initialize timer based on expiry time if provided
  useEffect(() => {
    if (expiryTime) {
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      const diffInSeconds = Math.floor(
        (expiryDate.getTime() - now.getTime()) / 1000,
      );

      if (diffInSeconds > 0) {
        setTimeLeft(diffInSeconds);
      } else {
        setTimeLeft(0);
        setStatus("failed");
        setIsPolling(false);
      }
    }
  }, [expiryTime]);

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
        paymentMethod,
      );
      setStatus(success ? "paid" : "failed");
      setIsPolling(false);
    } catch (error) {
      console.error("Error simulating payment:", error);
    }
  };

  // Refresh QR code
  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    try {
      // In a real implementation, you would call the API to refresh the QR code
      // For now, we'll just simulate a refresh by waiting
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "QR Code Diperbarui",
        description: "QR code pembayaran telah diperbarui.",
      });
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      toast({
        title: "Gagal Memperbarui QR Code",
        description: "Terjadi kesalahan saat memperbarui QR code.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Download QR code
  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qris-payment-${invoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy transaction ID
  const handleCopyTransactionId = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      toast({
        title: "ID Transaksi Disalin",
        description: "ID transaksi telah disalin ke clipboard.",
      });
    }
  };

  const getPaymentMethodTitle = () => {
    switch (paymentMethod) {
      case "OVO":
        return "Pembayaran OVO";
      case "GOPAY":
        return "Pembayaran GoPay";
      case "DANA":
        return "Pembayaran DANA";
      case "LINKAJA":
        return "Pembayaran LinkAja";
      case "SHOPEEPAY":
        return "Pembayaran ShopeePay";
      case "BANK_TRANSFER":
        return "Transfer Bank";
      case "VIRTUAL_ACCOUNT":
        return "Virtual Account";
      case "CREDIT_CARD":
        return "Kartu Kredit";
      default:
        return "Pembayaran QRIS";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getPaymentMethodTitle()}</DialogTitle>
          <DialogDescription>
            {paymentMethod === "QRIS"
              ? "Scan QR code di bawah ini untuk melakukan pembayaran"
              : paymentMethod === "BANK_TRANSFER"
                ? "Transfer ke rekening bank berikut untuk menyelesaikan pembayaran"
                : paymentMethod === "VIRTUAL_ACCOUNT"
                  ? "Gunakan kode virtual account berikut untuk menyelesaikan pembayaran"
                  : paymentMethod === "CREDIT_CARD"
                    ? "Masukkan detail kartu kredit Anda untuk menyelesaikan pembayaran"
                    : `Gunakan aplikasi ${paymentMethod} untuk menyelesaikan pembayaran`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {status === "pending" && (
            <>
              {paymentMethod === "QRIS" ||
              paymentMethod === "OVO" ||
              paymentMethod === "GOPAY" ||
              paymentMethod === "DANA" ||
              paymentMethod === "LINKAJA" ||
              paymentMethod === "SHOPEEPAY" ? (
                <div className="border rounded-lg p-4 bg-white relative">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  )}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Pembayaran"
                    className="w-64 h-64"
                  />
                </div>
              ) : paymentMethod === "BANK_TRANSFER" ? (
                <div className="border rounded-lg p-4 bg-white space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Bank</p>
                    <p className="font-medium text-lg">BCA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Nomor Rekening</p>
                    <div className="flex items-center">
                      <p className="font-medium text-lg">1234567890</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("1234567890");
                          toast({
                            title: "Nomor Rekening Disalin",
                            description:
                              "Nomor rekening telah disalin ke clipboard.",
                          });
                        }}
                        className="ml-2 p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Atas Nama</p>
                    <p className="font-medium">Sensasi Wangi Indonesia</p>
                  </div>
                </div>
              ) : paymentMethod === "VIRTUAL_ACCOUNT" ? (
                <div className="border rounded-lg p-4 bg-white space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Bank</p>
                    <p className="font-medium text-lg">BCA Virtual Account</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Nomor Virtual Account
                    </p>
                    <div className="flex items-center">
                      <p className="font-medium text-lg">
                        {transactionId || "8277081234567890"}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            transactionId || "8277081234567890",
                          );
                          toast({
                            title: "Nomor VA Disalin",
                            description:
                              "Nomor virtual account telah disalin ke clipboard.",
                          });
                        }}
                        className="ml-2 p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : paymentMethod === "CREDIT_CARD" ? (
                <div className="border rounded-lg p-4 bg-white space-y-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Nomor Kartu
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Nama Pemegang Kartu
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Nama sesuai kartu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Tanggal Kadaluarsa
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        CVV/CVC
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <Button className="w-full mt-2">Proses Pembayaran</Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-white relative">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Pembayaran"
                    className="w-64 h-64"
                  />
                </div>
              )}

              {(paymentMethod === "QRIS" ||
                paymentMethod === "OVO" ||
                paymentMethod === "GOPAY" ||
                paymentMethod === "DANA" ||
                paymentMethod === "LINKAJA" ||
                paymentMethod === "SHOPEEPAY") && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshQR}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadQR}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              <div className="text-center w-full">
                <p className="font-medium">Total Pembayaran</p>
                <p className="text-2xl font-bold">
                  Rp {amount.toLocaleString("id-ID")}
                </p>
                <div className="flex flex-col space-y-1 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Invoice: {invoiceNumber}
                  </p>
                  {transactionId && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <span className="truncate max-w-[180px]">
                        ID: {transactionId}
                      </span>
                      <button
                        onClick={handleCopyTransactionId}
                        className="ml-1 p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Waktu tersisa</span>
                  <span className="font-medium">{formatTimeLeft()}</span>
                </div>
                <Progress value={(timeLeft / 900) * 100} className="h-2" />
              </div>

              <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="instructions" className="flex-1">
                    Instruksi
                  </TabsTrigger>
                  <TabsTrigger value="help" className="flex-1">
                    Bantuan
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="instructions" className="pt-2">
                  <div className="text-sm space-y-2">
                    {paymentMethod === "QRIS" ? (
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                        <li>Pilih menu Scan QR atau QRIS</li>
                        <li>Scan QR code di atas</li>
                        <li>Periksa detail pembayaran dan konfirmasi</li>
                        <li>Selesaikan pembayaran di aplikasi Anda</li>
                      </ol>
                    ) : paymentMethod === "BANK_TRANSFER" ? (
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Catat nomor rekening dan nama penerima</li>
                        <li>Buka aplikasi mobile banking atau kunjungi ATM</li>
                        <li>
                          Pilih menu transfer dan masukkan detail rekening
                        </li>
                        <li>
                          Masukkan jumlah transfer sesuai dengan total
                          pembayaran
                        </li>
                        <li>
                          Gunakan nomor invoice sebagai keterangan transfer
                        </li>
                        <li>Simpan bukti transfer untuk verifikasi</li>
                      </ol>
                    ) : paymentMethod === "VIRTUAL_ACCOUNT" ? (
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Catat nomor virtual account yang ditampilkan</li>
                        <li>Buka aplikasi mobile banking atau kunjungi ATM</li>
                        <li>Pilih menu pembayaran/transfer virtual account</li>
                        <li>Masukkan nomor virtual account</li>
                        <li>Konfirmasi detail pembayaran</li>
                        <li>Selesaikan pembayaran sesuai instruksi</li>
                      </ol>
                    ) : paymentMethod === "CREDIT_CARD" ? (
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Masukkan nomor kartu kredit Anda</li>
                        <li>Masukkan nama pemegang kartu</li>
                        <li>Masukkan tanggal kadaluarsa kartu</li>
                        <li>
                          Masukkan kode CVV/CVC (3 digit di belakang kartu)
                        </li>
                        <li>Klik tombol "Bayar" untuk memproses pembayaran</li>
                        <li>
                          Ikuti instruksi autentikasi 3D Secure jika diminta
                        </li>
                      </ol>
                    ) : (
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>
                          Buka aplikasi {paymentMethod} di smartphone Anda
                        </li>
                        <li>Pilih menu Pembayaran atau Pay</li>
                        <li>
                          Scan QR code di atas atau masukkan kode pembayaran
                        </li>
                        <li>Periksa detail pembayaran dan konfirmasi</li>
                        <li>
                          Selesaikan pembayaran di aplikasi {paymentMethod}
                        </li>
                      </ol>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="help" className="pt-2">
                  <div className="text-sm space-y-2">
                    <p>
                      <strong>Pembayaran tidak muncul?</strong>
                    </p>
                    <p>
                      Jika pembayaran Anda tidak terdeteksi secara otomatis:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Pastikan Anda telah menyelesaikan pembayaran</li>
                      <li>
                        Klik tombol Refresh untuk memeriksa status terbaru
                      </li>
                      <li>
                        Tunggu beberapa saat, terkadang dibutuhkan waktu untuk
                        memproses pembayaran
                      </li>
                      <li>
                        Jika masih bermasalah, hubungi customer service kami
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
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
                {transactionId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ID Transaksi: {transactionId}
                  </p>
                )}
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
