import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Users, ShoppingBag } from "lucide-react";
import { getProduct } from "@/lib/marketplace";
import { createSambatan } from "@/lib/sambatan";
import { MarketplaceProduct } from "@/types/marketplace";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import MarketplaceLayout from "./MarketplaceLayout";
import { Badge } from "@/components/ui/badge";

export default function CreateSambatan() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participantCount, setParticipantCount] = useState(2);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membuat Sambatan.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const data = await getProduct(productId);

        if (!data) {
          toast({
            title: "Produk tidak ditemukan",
            description: "Produk yang Anda cari tidak ditemukan.",
            variant: "destructive",
          });
          navigate("/marketplace");
          return;
        }

        setProduct(data);

        // Set default participant count based on product settings
        if (data.min_participants) {
          setParticipantCount(data.min_participants);
        }
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
  }, [productId, toast, user, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCreateSambatan = async () => {
    if (!user || !product) return;

    // Validate participant count
    if (participantCount < 2) {
      toast({
        title: "Jumlah Peserta Tidak Valid",
        description: "Minimal jumlah peserta adalah 2 orang.",
        variant: "destructive",
      });
      return;
    }

    // Check max participants if set
    if (
      product.max_participants &&
      participantCount > product.max_participants
    ) {
      toast({
        title: "Jumlah Peserta Melebihi Batas",
        description: `Maksimal jumlah peserta adalah ${product.max_participants} orang.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const sambatan = await createSambatan(
        user.id,
        product.id,
        participantCount,
      );

      toast({
        title: "Berhasil",
        description:
          "Sambatan berhasil dibuat. Bagikan link untuk mengajak teman bergabung!",
      });

      // Navigate to the sambatan page
      navigate(`/marketplace/sambatan/${sambatan.id}`);
    } catch (error) {
      console.error("Error creating sambatan:", error);
      toast({
        title: "Error",
        description: "Gagal membuat Sambatan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Memuat produk..." />
        </div>
      </MarketplaceLayout>
    );
  }

  if (!product) {
    return (
      <MarketplaceLayout>
        <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <p className="text-gray-500">Produk tidak ditemukan.</p>
          <Link
            to="/marketplace"
            className="mt-4 inline-block text-purple-600 hover:underline"
          >
            Kembali ke Marketplace
          </Link>
        </Card>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout
      title="Buat Sambatan"
      subtitle="Beli bersama dengan komunitas Sensasiwangi"
    >
      <div className="flex items-center mb-6">
        <Link
          to={`/marketplace/product/${product.id}`}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Detail Produk
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Product Info */}
        <div className="md:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <ShoppingBag className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6 whitespace-pre-line">
                {product.description}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sambatan Form */}
        <div>
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Pengaturan Sambatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="participant-count" className="mb-2 block">
                    Jumlah Peserta (termasuk Anda)
                  </Label>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() =>
                        setParticipantCount(Math.max(2, participantCount - 1))
                      }
                    >
                      -
                    </Button>
                    <Input
                      id="participant-count"
                      type="number"
                      min="2"
                      max={product.max_participants || "10"}
                      value={participantCount}
                      onChange={(e) =>
                        setParticipantCount(parseInt(e.target.value) || 2)
                      }
                      className="mx-2 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() =>
                        setParticipantCount(
                          Math.min(
                            product.max_participants || 10,
                            participantCount + 1,
                          ),
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal {product.min_participants || 2} peserta, maksimal{" "}
                    {product.max_participants || 10} peserta
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Ringkasan Sambatan</Label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Produk</span>
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Harga</span>
                      <span className="text-sm font-medium">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Jumlah Peserta
                      </span>
                      <span className="text-sm font-medium">
                        {participantCount} orang
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          Harga per Peserta
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {formatPrice(product.price / participantCount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                  onClick={handleCreateSambatan}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat Sambatan...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Buat Sambatan
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500 mt-4">
                  <p>
                    Dengan membuat Sambatan, Anda setuju untuk menjadi inisiator
                    dan bertanggung jawab untuk mengajak peserta lain bergabung.
                    Sambatan akan aktif selama 7 hari atau hingga kuota peserta
                    terpenuhi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
