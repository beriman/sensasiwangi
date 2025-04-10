import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { MarketplaceProduct } from "@/types/marketplace";

interface ProductShareCardProps {
  product: MarketplaceProduct;
  compact?: boolean;
}

export default function ProductShareCard({
  product,
  compact = false,
}: ProductShareCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (compact) {
    return (
      <Link
        to={`/marketplace/product/${product.id}`}
        className="block no-underline"
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex">
            <div className="w-16 h-16 bg-gray-100 flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <CardContent className="p-2 flex-1">
              <div className="text-xs font-medium line-clamp-1">{product.name}</div>
              <div className="text-xs text-purple-600 font-semibold mt-1">
                {formatPrice(product.price)}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      to={`/marketplace/product/${product.id}`}
      className="block no-underline"
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square w-full bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <div className="font-medium line-clamp-2">{product.name}</div>
          <div className="text-purple-600 font-semibold mt-1">
            {formatPrice(product.price)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Lihat Produk
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
