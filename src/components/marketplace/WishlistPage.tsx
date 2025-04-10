import React, { useState, useEffect } from "react";
import MarketplaceLayout from "./MarketplaceLayout";
import { getWishlist } from "@/lib/wishlist";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { MarketplaceProduct } from "@/types/marketplace";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getWishlist(user);
        setWishlistItems(data);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        toast({
          title: "Error",
          description: "Gagal memuat wishlist. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const handleWishlistChange = (productId: string, isWishlisted: boolean) => {
    if (!isWishlisted) {
      // Remove from wishlist
      setWishlistItems((prev) => prev.filter((item) => item.product_id !== productId));
    }
  };

  if (loading) {
    return (
      <MarketplaceLayout
        title="Wishlist Saya"
        subtitle="Produk yang Anda simpan untuk dibeli nanti"
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Memuat wishlist..." />
        </div>
      </MarketplaceLayout>
    );
  }

  if (!user) {
    return (
      <MarketplaceLayout
        title="Wishlist Saya"
        subtitle="Produk yang Anda simpan untuk dibeli nanti"
      >
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-8">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Login untuk melihat wishlist Anda
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Anda perlu login untuk menyimpan dan melihat produk favorit Anda.
          </p>
          <Link to="/login">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Login Sekarang
            </Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <MarketplaceLayout
        title="Wishlist Saya"
        subtitle="Produk yang Anda simpan untuk dibeli nanti"
      >
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-8">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Wishlist Anda kosong
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Anda belum menyimpan produk apapun ke wishlist. Jelajahi marketplace
            dan tambahkan produk yang Anda sukai.
          </p>
          <Link to="/marketplace">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Jelajahi Marketplace
            </Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout
      title="Wishlist Saya"
      subtitle="Produk yang Anda simpan untuk dibeli nanti"
    >
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">
            <Heart className="h-5 w-5 text-red-500 inline-block mr-2" />
            Produk yang Anda Simpan ({wishlistItems.length})
          </h2>
          <Link to="/marketplace">
            <Button variant="outline" className="text-sm">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Lanjut Belanja
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product as MarketplaceProduct}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
