import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Users, Star } from "lucide-react";
import { MarketplaceProduct } from "@/types/marketplace";

interface ProductCardProps {
  product: MarketplaceProduct;
  isSambatan?: boolean;
}

export default function ProductCard({
  product,
  isSambatan = false,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/marketplace/product/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 bg-white border border-gray-100 rounded-lg relative">
        {isSambatan && (
          <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs py-1 px-2 flex items-center justify-center">
            <Users className="h-3 w-3 mr-1" />
            Sambatan
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
          <div className="mt-2">
            <p className="font-bold text-base text-red-600">
              {formatPrice(product.price)}
            </p>
          </div>
          <div className="flex items-center mt-1">
            <div className="flex items-center text-yellow-500">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs ml-1">4.9</span>
            </div>
            <span className="text-xs text-gray-500 mx-1">|</span>
            <span className="text-xs text-gray-500">Terjual 50+</span>
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
