import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Users, Star, Heart, Loader2 } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted,
} from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductCardProps {
  product: MarketplaceProduct;
  isSambatan?: boolean;
  onWishlistChange?: (productId: string, isWishlisted: boolean) => void;
}

export default function ProductCard({
  product,
  isSambatan = false,
  onWishlistChange,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(
    product.is_wishlisted || false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      setIsCheckingStatus(true);
      try {
        const wishlisted = await isProductWishlisted(product.id);
        setIsWishlisted(wishlisted);
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkWishlistStatus();
  }, [product.id, user]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menambahkan ke wishlist.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        toast({
          title: "Berhasil",
          description: "Produk dihapus dari wishlist.",
        });
      } else {
        await addToWishlist(product.id);
        toast({
          title: "Berhasil",
          description: "Produk ditambahkan ke wishlist.",
        });
      }
      const newWishlistState = !isWishlisted;
      setIsWishlisted(newWishlistState);

      // Notify parent component if callback exists
      if (onWishlistChange) {
        onWishlistChange(product.id, newWishlistState);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status wishlist. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderWishlistButton = () => {
    const tooltipText = isWishlisted
      ? "Hapus dari wishlist"
      : "Tambah ke wishlist";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleWishlistToggle}
              disabled={isLoading || isCheckingStatus}
              className={`p-1.5 rounded-full bg-white shadow-sm border border-gray-100 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${isLoading ? "animate-pulse" : ""}`}
              aria-label={tooltipText}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} ${isWishlisted ? "scale-110" : "scale-100"} transition-transform duration-200`}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Link to={`/marketplace/product/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 bg-white border border-gray-100 rounded-lg relative group">
        {isSambatan && (
          <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs py-1 px-2 flex items-center justify-center">
            <Users className="h-3 w-3 mr-1" />
            Sambatan
          </div>
        )}
        {isWishlisted && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="bg-red-50 text-red-500 border border-red-100"
            >
              <Heart className="h-3 w-3 mr-1 fill-red-500" />
              Wishlist
            </Badge>
          </div>
        )}
        <div
          className={`aspect-square w-full overflow-hidden bg-gray-100 ${isSambatan ? "pt-6" : ""}`}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-all hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="text-sm line-clamp-2 h-10 text-gray-700">
            {product.name}
          </h3>
          <div className="mt-2 flex justify-between items-center">
            <p className="font-bold text-base text-red-600">
              {formatPrice(product.price)}
            </p>
            {renderWishlistButton()}
          </div>
          <div className="flex items-center mt-1">
            <div className="flex items-center text-yellow-500">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs ml-1">
                {product.avg_rating ? product.avg_rating.toFixed(1) : "0.0"}
              </span>
            </div>
            <span className="text-xs text-gray-500 mx-1">|</span>
            <span className="text-xs text-gray-500">
              {product.review_count
                ? `${product.review_count} ulasan`
                : "Belum ada ulasan"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex items-center border-t border-gray-100">
          <div className="flex items-center">
            <Avatar className="h-4 w-4 mr-1">
              <AvatarImage
                src={
                  product.seller?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.seller_id}`
                }
                alt={product.seller?.full_name || ""}
              />
              <AvatarFallback>
                {product.seller?.full_name?.[0] || "S"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate">
              {product.seller?.full_name || "Seller"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
