import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, User, Calendar } from "lucide-react";
import { getProduct } from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const data = await getProduct(productId);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Gagal memuat produk. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menghubungi penjual.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Fitur dalam pengembangan",
      description: "Fitur chat dengan penjual sedang dalam pengembangan.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat produk..." />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
        <p className="text-gray-500">Produk tidak ditemukan.</p>
        <Link
          to="/marketplace"
          className="mt-4 inline-block text-purple-600 hover:underline"
        >
          Kembali ke Marketplace
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link
          to="/marketplace"
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ maxHeight: "500px" }}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gray-100">
              <ShoppingBag className="h-24 w-24 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                  {formatPrice(product.price)}
                </Badge>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {product.name}
                </CardTitle>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {formatDistanceToNow(new Date(product.created_at), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6 whitespace-pre-line">
              {product.description}
            </div>

            <div className="flex items-center space-x-4 mt-8 mb-6">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    product.seller?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.seller_id}`
                  }
                  alt={product.seller?.full_name || "Seller"}
                />
                <AvatarFallback>
                  {product.seller?.full_name?.[0] || "S"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {product.seller?.full_name || "Seller"}
                </p>
                <p className="text-sm text-gray-500">Penjual</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                onClick={handleContact}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
              >
                Hubungi Penjual
              </Button>
              {user && user.id === product.seller_id && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/marketplace/my-shop/edit/${product.id}`)
                  }
                >
                  Edit Produk
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
