import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingBag,
  Tag,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Truck,
  Package,
} from "lucide-react";
import { Sambatan } from "@/types/marketplace";
import { Link } from "react-router-dom";

interface SambatanProductInfoProps {
  sambatan: Sambatan;
}

export default function SambatanProductInfo({ sambatan }: SambatanProductInfoProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const progress = (sambatan.current_quantity / sambatan.target_quantity) * 100;
  const isExpired = sambatan.expires_at && new Date(sambatan.expires_at) < new Date();
  const participantsNeeded = sambatan.target_quantity - sambatan.current_quantity;

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!sambatan.expires_at) return null;

    const now = new Date();
    const expiryDate = new Date(sambatan.expires_at);

    if (now > expiryDate) return "Kedaluwarsa";

    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} hari ${diffHours} jam lagi`;
    } else if (diffHours > 0) {
      return `${diffHours} jam ${diffMinutes} menit lagi`;
    } else {
      return `${diffMinutes} menit lagi`;
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (sambatan.status === "cancelled") {
      return {
        label: "Dibatalkan",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-4 w-4 mr-1" />
      };
    } else if (isExpired && sambatan.status === "open") {
      return {
        label: "Kedaluwarsa",
        color: "bg-gray-100 text-gray-800",
        icon: <AlertTriangle className="h-4 w-4 mr-1" />
      };
    } else if (sambatan.status === "completed") {
      return {
        label: "Selesai",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4 mr-1" />
      };
    } else if (sambatan.status === "closed") {
      return {
        label: "Tertutup",
        color: "bg-yellow-100 text-yellow-800",
        icon: <CheckCircle className="h-4 w-4 mr-1" />
      };
    } else {
      // Open status
      return {
        label: "Terbuka",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4 mr-1" />
      };
    }
  };

  const statusBadge = getStatusBadge();
  const timeRemaining = getTimeRemaining();

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Badge className={statusBadge.color}>
            {statusBadge.icon}
            {statusBadge.label}
          </Badge>
          {sambatan.product?.category && (
            <Badge variant="outline" className="ml-2">
              <Tag className="h-3 w-3 mr-1" />
              {sambatan.product.category}
            </Badge>
          )}
          {sambatan.expires_at && sambatan.status === "open" && !isExpired && (
            <Badge className="ml-auto bg-amber-100 text-amber-800">
              <Clock className="h-3 w-3 mr-1" />
              {timeRemaining}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">{sambatan.product?.name}</h1>

        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage
                src={
                  sambatan.product?.seller?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${sambatan.product?.seller?.id}`
                }
                alt={sambatan.product?.seller?.full_name || ""}
              />
              <AvatarFallback>
                {sambatan.product?.seller?.full_name?.[0] || "S"}
              </AvatarFallback>
            </Avatar>
            <Link
              to={`/profile/${sambatan.product?.seller?.id}`}
              className="text-sm text-gray-600 hover:text-purple-600 hover:underline"
            >
              {sambatan.product?.seller?.full_name || "Penjual"}
            </Link>
          </div>
          <Separator orientation="vertical" className="mx-3 h-4" />
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>{sambatan.product?.rating || "4.5"}</span>
          </div>
          <Separator orientation="vertical" className="mx-3 h-4" />
          <div className="flex items-center text-sm text-gray-600">
            <Package className="h-4 w-4 mr-1" />
            <span>{sambatan.product?.stock || "Stok tersedia"}</span>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-6">
          <div className="text-3xl font-bold text-purple-600">
            {sambatan.product?.price && formatPrice(sambatan.product.price)}
          </div>
          {sambatan.product?.original_price && sambatan.product.original_price > sambatan.product.price && (
            <div className="text-lg text-gray-400 line-through">
              {formatPrice(sambatan.product.original_price)}
            </div>
          )}
          {sambatan.product?.discount_percentage > 0 && (
            <Badge className="bg-green-100 text-green-800 ml-2">
              Hemat {sambatan.product.discount_percentage}%
            </Badge>
          )}
        </div>

        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <div className="flex items-center mb-3">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold">Status Sambatan</h3>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-3"
              style={{
                background: progress >= 75 ? 'linear-gradient(to right, #22c55e, #22c55e)' :
                          progress >= 50 ? 'linear-gradient(to right, #eab308, #eab308)' :
                          'linear-gradient(to right, #ef4444, #ef4444)'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Peserta saat ini</p>
              <p className="font-semibold">{sambatan.current_quantity} orang</p>
            </div>
            <div>
              <p className="text-gray-500">Target peserta</p>
              <p className="font-semibold">{sambatan.target_quantity} orang</p>
            </div>
            {sambatan.max_participants && (
              <div>
                <p className="text-gray-500">Maks. peserta</p>
                <p className="font-semibold">{sambatan.max_participants} orang</p>
              </div>
            )}
            {sambatan.status === "open" && !isExpired && (
              <>
                <div>
                  <p className="text-gray-500">Kurang</p>
                  <p className="font-semibold text-amber-600">{participantsNeeded} orang lagi</p>
                </div>
                <div>
                  <p className="text-gray-500">Berakhir pada</p>
                  <p className="font-semibold">
                    {new Date(sambatan.expires_at || "").toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </>
            )}
          </div>

          {sambatan.status === "open" && !isExpired && participantsNeeded > 0 && (
            <div className="mt-4 bg-white p-3 rounded-lg border border-purple-100 flex items-start">
              <Info className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Sambatan ini masih membutuhkan {participantsNeeded} peserta lagi</p>
                <p className="text-gray-600">Ajak teman Anda untuk bergabung agar Sambatan ini berhasil!</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Deskripsi Produk</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line">
              {sambatan.product?.description || "Tidak ada deskripsi produk."}
            </p>
          </div>

          {sambatan.product?.shipping_info && (
            <div>
              <h3 className="font-semibold mb-2">Informasi Pengiriman</h3>
              <div className="flex items-start text-sm text-gray-600">
                <Truck className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                <p>{sambatan.product.shipping_info}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
