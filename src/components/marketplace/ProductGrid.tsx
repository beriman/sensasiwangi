import React, { useEffect, useState } from "react";
import { getProducts } from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import ProductCard from "./ProductCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShoppingBag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

interface ProductGridProps {
  category?: string;
  limit?: number;
  showAddButton?: boolean;
}

export default function ProductGrid({ 
  category, 
  limit = 12,
  showAddButton = false 
}: ProductGridProps) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts({
          category,
          limit,
          sortBy: "newest"
        });
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Gagal memuat produk. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, limit]);

  const handleWishlistChange = (productId: string, isWishlisted: boolean) => {
    // Update local state when wishlist status changes
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, is_wishlisted: isWishlisted } 
          : product
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat produk..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Belum ada produk
        </h3>
        <p className="text-gray-500 mb-6">
          Belum ada produk yang ditawarkan saat ini.
        </p>
        {showAddButton && user && (
          <Link to="/marketplace/my-shop/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Tambah Produk Baru
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSambatan={product.is_sambatan || false}
          onWishlistChange={handleWishlistChange}
        />
      ))}
      {showAddButton && user && products.length > 0 && (
        <Link to="/marketplace/my-shop/new" className="h-full">
          <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center hover:border-purple-300 transition-colors">
            <div className="text-center p-4">
              <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tambah Produk Baru</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
