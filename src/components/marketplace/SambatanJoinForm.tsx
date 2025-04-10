import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  CreditCard,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth-provider";

interface SambatanJoinFormProps {
  sambatan: Sambatan;
  userParticipation: SambatanParticipant | null;
  isInitiator: boolean;
  canJoin: boolean;
  canPayment: boolean;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onJoin: () => void;
  onShowPayment: () => void;
}

export default function SambatanJoinForm({
  sambatan,
  userParticipation,
  isInitiator,
  canJoin,
  canPayment,
  quantity,
  setQuantity,
  onJoin,
  onShowPayment,
}: SambatanJoinFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      await onJoin();
    } finally {
      setLoading(false);
    }
  };

  const handleShowPayment = async () => {
    setLoading(true);
    try {
      await onShowPayment();
    } finally {
      setLoading(false);
    }
  };

  const isExpired = sambatan.expires_at && new Date(sambatan.expires_at) < new Date();
  const isOpen = sambatan.status === "open" && !isExpired;
  const productPrice = sambatan.product?.price || 0;
  const totalPrice = productPrice * quantity;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          {isInitiator ? (
            <>
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Sambatan Anda
            </>
          ) : userParticipation ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Anda Telah Bergabung
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
              Gabung Sambatan
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Section */}
          {userParticipation && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Badge
                  className={
                    userParticipation.payment_status === "verified"
                      ? "bg-green-100 text-green-800"
                      : userParticipation.payment_status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {userParticipation.payment_status === "verified" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : userParticipation.payment_status === "pending" ? (
                    <Clock className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {userParticipation.payment_status === "verified"
                    ? "Pembayaran Terverifikasi"
                    : userParticipation.payment_status === "pending"
                      ? "Menunggu Pembayaran"
                      : "Pembayaran Dibatalkan"}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p>Jumlah Pesanan: {userParticipation.quantity}</p>
                <p>
                  Total Pembayaran:{" "}
                  <span className="font-semibold">
                    {formatPrice(productPrice * userParticipation.quantity)}
                  </span>
                </p>
                <p>
                  Tanggal Bergabung:{" "}
                  {new Date(userParticipation.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Join Form */}
          {canJoin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Jumlah</span>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setQuantity(val);
                      }
                    }}
                    className="h-8 w-16 mx-2 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Harga Satuan</span>
                  <span>{formatPrice(productPrice)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Jumlah</span>
                  <span>{quantity}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={loading || !user}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gabung Sambatan
                  </>
                )}
              </Button>

              {!user && (
                <div className="text-center text-sm text-gray-500">
                  <Link
                    to="/login"
                    className="text-purple-600 hover:underline"
                  >
                    Login
                  </Link>{" "}
                  untuk bergabung dengan Sambatan ini
                </div>
              )}
            </div>
          )}

          {/* Payment Button */}
          {canPayment && (
            <Button
              className="w-full"
              onClick={handleShowPayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Bayar Sekarang
                </>
              )}
            </Button>
          )}

          {/* Sambatan Info */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <span>
                {sambatan.current_quantity} dari {sambatan.target_quantity}{" "}
                peserta
              </span>
              {sambatan.max_participants && (
                <Badge className="ml-2 bg-gray-100 text-gray-800 text-xs">
                  Maks. {sambatan.max_participants} peserta
                </Badge>
              )}
            </div>
            {sambatan.expires_at && (
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span>
                  Berakhir pada{" "}
                  {new Date(sambatan.expires_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <ShoppingBag className="h-4 w-4 text-gray-500 mr-2" />
              <span>
                Produk oleh{" "}
                <Link
                  to={`/profile/${sambatan.product?.seller?.id}`}
                  className="text-purple-600 hover:underline"
                >
                  {sambatan.product?.seller?.full_name || "Penjual"}
                </Link>
              </span>
            </div>
          </div>

          {/* Initiator Info */}
          {isInitiator && isOpen && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Sambatan Anda</h3>
              <p className="text-sm text-gray-600 mb-3">
                Anda adalah inisiator Sambatan ini. Bagikan link Sambatan ini
                untuk mengajak lebih banyak peserta.
              </p>
              <Button variant="outline" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Bagikan Sambatan
              </Button>
            </div>
          )}

          {/* Expired or Closed Info */}
          {!isOpen && (
            <div
              className={`p-4 rounded-lg ${
                sambatan.status === "cancelled" || isExpired
                  ? "bg-red-50"
                  : sambatan.status === "completed"
                    ? "bg-green-50"
                    : "bg-yellow-50"
              }`}
            >
              <h3 className="font-medium mb-2">
                {sambatan.status === "cancelled"
                  ? "Sambatan Dibatalkan"
                  : isExpired
                    ? "Sambatan Kedaluwarsa"
                    : sambatan.status === "completed"
                      ? "Sambatan Selesai"
                      : "Sambatan Tertutup"}
              </h3>
              <p className="text-sm text-gray-600">
                {sambatan.status === "cancelled"
                  ? "Sambatan ini telah dibatalkan dan tidak menerima peserta baru."
                  : isExpired
                    ? "Batas waktu Sambatan telah berakhir."
                    : sambatan.status === "completed"
                      ? "Sambatan ini telah selesai dan produk sedang dalam proses pengiriman."
                      : "Sambatan ini telah tertutup dan tidak menerima peserta baru."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
