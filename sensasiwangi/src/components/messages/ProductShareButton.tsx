// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { ShoppingBag, Search, Loader2 } from "lucide-react";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";
// @ts-ignore
import ProductShareCard from "./ProductShareCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

interface ProductShareButtonProps {
  onSelectProduct: (product: MarketplaceProduct) => void;
}

export default function ProductShareButton({
  onSelectProduct,
}: ProductShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setSearched(true);

      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq("status", "active")
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectProduct = (product: MarketplaceProduct) => {
    onSelectProduct(product);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <ShoppingBag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Produk</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Mencari produk...</p>
            </div>
          ) : searched && products.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">
                Tidak ada produk yang ditemukan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="cursor-pointer"
                >
                  <ProductShareCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


