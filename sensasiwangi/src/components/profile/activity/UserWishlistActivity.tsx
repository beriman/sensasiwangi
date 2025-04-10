import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Heart } from "lucide-react";
import { getWishlistedProducts } from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import ProductCard from "@/components/marketplace/ProductCard";

interface UserWishlistActivityProps {
  userId: string;
}

export default function UserWishlistActivity({
  userId,
}: UserWishlistActivityProps) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const wishlistedProducts = await getWishlistedProducts(userId);
        setProducts(wishlistedProducts);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner text="Loading wishlist..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <Heart className="h-5 w-5 mr-2" />
          Wishlist ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Belum ada produk di wishlist
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
