import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Users, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Sambatan } from "@/types/marketplace";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!sambatan.expires_at) return null;
    
    const now = new Date();
    const expiryDate = new Date(sambatan.expires_at);
    
    if (now > expiryDate) return "Kedaluwarsa";
    
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} hari lagi`;
    } else if (diffHours > 0) {
      return `${diffHours} jam lagi`;
    } else {
      return "< 1 jam lagi";
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (sambatan.status === "cancelled") {
      return {
        label: "Dibatalkan",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3 mr-1" />
      };
    } else if (isExpired && sambatan.status === "open") {
      return {
        label: "Kedaluwarsa",
        color: "bg-gray-100 text-gray-800",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      };
    } else if (sambatan.status === "completed") {
      return {
        label: "Selesai",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    } else if (sambatan.status === "closed") {
      return {
        label: "Tertutup",
        color: "bg-yellow-100 text-yellow-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    } else {
      // Open status
      const timeRemaining = getTimeRemaining();
      if (timeRemaining && timeRemaining.includes("jam")) {
        return {
          label: "Segera Berakhir",
          color: "bg-amber-100 text-amber-800",
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      }
      return {
        label: "Terbuka",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    }
  };

  const statusBadge = getStatusBadge();
  const timeRemaining = getTimeRemaining();
  const participantsNeeded = sambatan.target_quantity - sambatan.current_quantity;

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
            <Badge className={statusBadge.color}>
              {statusBadge.icon}
              {statusBadge.label}
            </Badge>
          </div>
          {sambatan.product?.category && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                {sambatan.product.category}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-purple-600 mr-1" />
            <span className="text-xs text-purple-600 font-medium">
              Sambatan
            </span>
            {sambatan.status === "open" && !isExpired && participantsNeeded > 0 && (
              <Badge className="ml-auto bg-purple-100 text-purple-800 text-xs">
                Butuh {participantsNeeded} peserta lagi
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg line-clamp-1">
            {sambatan.product?.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              {sambatan.product?.price && formatPrice(sambatan.product.price)}
            </Badge>
            {sambatan.product?.discount_percentage > 0 && (
              <Badge className="bg-green-100 text-green-800">
                Hemat {sambatan.product.discount_percentage}%
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mb-1">
                    <Progress 
                      value={progress} 
                      className="h-2"
                      style={{
                        background: progress >= 75 ? 'linear-gradient(to right, #22c55e, #22c55e)' : 
                                  progress >= 50 ? 'linear-gradient(to right, #eab308, #eab308)' : 
                                  'linear-gradient(to right, #ef4444, #ef4444)'
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Progress: {progress.toFixed(0)}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {sambatan.current_quantity} dari {sambatan.target_quantity}{" "}
                peserta
              </span>
              <span className={`font-medium ${
                progress >= 75 ? 'text-green-600' : 
                progress >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {progress.toFixed(0)}%
              </span>
            </div>
            {sambatan.expires_at && sambatan.status === "open" && !isExpired && (
              <div className="flex items-center mt-1 text-xs text-yellow-600">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {timeRemaining} ({new Date(sambatan.expires_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })})
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
