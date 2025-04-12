// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Link, useNavigate } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { ShoppingBag, Plus, Edit, Trash2 } from "lucide-react";
// @ts-ignore
import { getProductsBySeller, deleteProduct } from "../../lib/marketplace";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

export default function MyShop() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk mengakses lapak Anda.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Check if getProductsBySeller is available, otherwise fallback to direct query
        let data;
        try {
          data = await getProductsBySeller(user.id);
        } catch (e) {
          // Fallback to direct query if function not available
          const { data: productsData, error } = await supabase
            .from("marketplace_products")
            .select("*")
            .eq("seller_id", user.id);

          if (error) throw error;
          data = productsData || [];
        }
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
  }, [user, toast, navigate]);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete);
      setProducts(products.filter((p) => p.id !== productToDelete));
      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus produk. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setProductToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat produk..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lapak Saya</h2>
        <Link to="/marketplace/my-shop/new">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> Tambah Produk
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Anda belum memiliki produk.</p>
          <p className="mt-2 text-gray-500">
            Mulai jual produk parfum Anda sekarang!
          </p>
          <div className="mt-4">
            <Link to="/marketplace/my-shop/new">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" /> Tambah Produk
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-48 h-48 bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                        {formatPrice(product.price)}
                      </Badge>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {product.name}
                      </h3>
                    </div>
                    <Badge
                      className={
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {product.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                  <p className="text-gray-500 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/marketplace/product/${product.id}`)
                      }
                    >
                      Lihat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/marketplace/my-shop/edit/${product.id}`)
                      }
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => setProductToDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus produk ini?
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setProductToDelete(null)}
                          >
                            Batal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteProduct}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


