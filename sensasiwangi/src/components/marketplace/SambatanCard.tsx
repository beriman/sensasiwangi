// @ts-ignore
import React from "react";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardFooter } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Progress } from "../../components/ui/progress";
// @ts-ignore
import { ShoppingBag, Users, Clock } from "lucide-react";
// @ts-ignore
import { Sambatan } from "../../types/marketplace";

interface SambatanCardProps {
  sambatan: Sambatan;
}

export default function SambatanCard({ sambatan }: SambatanCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const progress = (sambatan.current_quantity / sambatan.target_quantity) * 100;

  // Check if sambatan is expired
  const isExpired =
    sambatan.expires_at && new Date(sambatan.expires_at) < new Date();

  return (
    <Link to={`/marketplace/sambatan/${sambatan.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
        <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
          {sambatan.product?.image_url ? (
            <img
              src={sambatan.product.image_url}
              alt={sambatan.product.name}
              className="h-full w-full object-cover transition-all hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              className={
                sambatan.status === "open" && !isExpired
                  ? "bg-green-100 text-green-800"
                  : sambatan.status === "cancelled" || isExpired
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }
            >
              {sambatan.status === "open" && !isExpired
                ? "Terbuka"
                : sambatan.status === "cancelled"
                  ? "Dibatalkan"
                  : isExpired && sambatan.status === "open"
                    ? "Kedaluwarsa"
                    : "Tertutup"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-purple-600 mr-1" />
            <span className="text-xs text-purple-600 font-medium">
              Sambatan
            </span>
          </div>
          <h3 className="font-semibold text-lg line-clamp-1">
            {sambatan.product?.name}
          </h3>
          <div className="mt-2">
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              {sambatan.product?.price && formatPrice(sambatan.product.price)}
            </Badge>
          </div>
          <div className="mt-3">
            <div className="mb-1">
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {sambatan.current_quantity} dari {sambatan.target_quantity}{" "}
                peserta
              </span>
              <span className="text-purple-600 font-medium">
                {progress.toFixed(0)}%
              </span>
            </div>
            {sambatan.expires_at && sambatan.status === "open" && (
              <div className="flex items-center mt-1 text-xs text-yellow-600">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  Berakhir{" "}
                  {new Date(sambatan.expires_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage
              src={
                sambatan.initiator?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${sambatan.initiator_id}`
              }
              alt={sambatan.initiator?.full_name || ""}
            />
            <AvatarFallback>
              {sambatan.initiator?.full_name?.[0] || "S"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500">
            Dibuat oleh {sambatan.initiator?.full_name || "User"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}


