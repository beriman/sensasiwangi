import React, { useEffect, useState } from "react";
import { getProducts } from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import ProductCard from "./ProductCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShoppingBag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ProductGrid() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
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
  }, []);

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
        <p className="text-gray-500">
          Belum ada produk yang ditawarkan saat ini.
        </p>
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
        />
      ))}
    </div>
  );
}
