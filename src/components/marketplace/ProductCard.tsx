import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { MarketplaceProduct } from "@/types/marketplace";

interface ProductCardProps {
  product: MarketplaceProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/marketplace/product/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
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
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-3">
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              {formatPrice(product.price)}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center">
          <Avatar className="h-6 w-6 mr-2">
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
          <span className="text-xs text-gray-500">
            {product.seller?.full_name || "Seller"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
