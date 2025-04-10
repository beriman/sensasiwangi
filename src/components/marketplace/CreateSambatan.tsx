import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Users, ShoppingBag, Info } from "lucide-react";
import { getProduct } from "@/lib/marketplace";
import { createSambatan } from "@/lib/sambatan";
import { MarketplaceProduct } from "@/types/marketplace";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import MarketplaceLayout from "./MarketplaceLayout";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CreateSambatan() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [targetQuantity, setTargetQuantity] = useState(2);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [expirationDays, setExpirationDays] = useState(7);

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
        const productData = await getProduct(productId);
        if (!productData) {
          toast({
            title: "Produk tidak ditemukan",
            description: "Produk yang Anda cari tidak ditemukan.",
            variant: "destructive",
          });
          navigate("/marketplace");
          return;
        }
        setProduct(productData);
        
        // Initialize maxParticipants based on product settings
        if (productData.max_participants) {
          setMaxParticipants(productData.max_participants);
        } else {
          setMaxParticipants(undefined);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data produk. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, user, toast, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCreateSambatan = async () => {
    if (!user || !product) return;

    // Validate target quantity
    if (targetQuantity < 2) {
      toast({
        title: "Jumlah Target Tidak Valid",
        description: "Minimal jumlah target adalah 2 item.",
        variant: "destructive",
      });
      return;
    }

    // Validate max participants
    if (maxParticipants !== undefined && maxParticipants < targetQuantity) {
      toast({
        title: "Jumlah Maksimum Peserta Tidak Valid",
        description: "Maksimum peserta tidak boleh kurang dari target kuantitas.",
        variant: "destructive",
      });
      return;
    }

    // Check product max_participants if set
    if (
      product.max_participants &&
      maxParticipants &&
      maxParticipants > product.max_participants
    ) {
      toast({
        title: "Jumlah Maksimum Peserta Melebihi Batas",
        description: `Maksimal jumlah peserta yang diizinkan untuk produk ini adalah ${product.max_participants} orang.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const sambatan = await createSambatan(
        user.id,
        product.id,
        targetQuantity,
        maxParticipants,
        expirationDays
      );

      toast({
        title: "Berhasil",
        description:
          "Sambatan berhasil dibuat. Bagikan link untuk mengajak teman bergabung!",
      });

      // Navigate to the sambatan page
      navigate(`/marketplace/sambatan/${sambatan.id}`);
    } catch (error: any) {
      console.error("Error creating sambatan:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat Sambatan. Silakan coba lagi.",
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
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Produk Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">
            Produk yang Anda cari tidak ditemukan atau telah dihapus.
          </p>
          <Link to="/marketplace">
            <Button>Kembali ke Marketplace</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout title="Buat Sambatan Baru">
      <div className="flex items-center mb-6">
        <Link
          to={`/marketplace/product/${productId}`}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Detail Produk
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Buat Sambatan Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-purple-50 border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-800">Tentang Sambatan</AlertTitle>
                <AlertDescription className="text-purple-700">
                  Sambatan adalah fitur patungan yang memungkinkan Anda membeli produk
                  bersama dengan pengguna lain. Dengan Sambatan, Anda bisa membeli
                  produk dengan harga lebih terjangkau dan berbagi biaya pengiriman.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="target-quantity" className="flex items-center">
                    Target Kuantitas
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-60">
                            Jumlah minimum item yang harus terkumpul agar Sambatan berhasil.
                            Sambatan akan ditutup setelah mencapai target ini.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="target-quantity"
                    type="number"
                    min="2"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 2)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal 2 item (termasuk item Anda)
                  </p>
                </div>

                <div>
                  <Label htmlFor="max-participants" className="flex items-center">
                    Maksimum Peserta
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-60">
                            Jumlah maksimum peserta yang dapat bergabung dengan Sambatan ini.
                            Biarkan kosong jika tidak ada batasan (selain target kuantitas).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="max-participants"
                    type="number"
                    min={targetQuantity}
                    value={maxParticipants === undefined ? "" : maxParticipants}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                      setMaxParticipants(value);
                    }}
                    className="mt-1"
                    placeholder={`Minimal ${targetQuantity} peserta`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {product.max_participants ? (
                      <>Maksimal {product.max_participants} peserta (batas dari penjual)</>
                    ) : (
                      <>Biarkan kosong jika tidak ada batasan</>
                    )}
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiration-days" className="flex items-center">
                    Masa Berlaku
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-60">
                            Sambatan akan kedaluwarsa setelah jumlah hari yang ditentukan
                            jika target kuantitas belum tercapai.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="expiration-days"
                    type="number"
                    min="1"
                    max="30"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sambatan akan kedaluwarsa dalam {expirationDays} hari
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateSambatan}
                  disabled={submitting}
                  className="w-full md:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Sambatan...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Buat Sambatan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-20">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Detail Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square w-full overflow-hidden bg-gray-100 rounded-md">
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

              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                {product.category && (
                  <Badge variant="outline" className="mt-1">
                    {product.category}
                  </Badge>
                )}
              </div>

              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(product.price)}
                </div>
                {product.original_price && product.original_price > product.price && (
                  <div className="text-sm text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Penjual</span>
                  <span className="font-medium">
                    {product.seller?.full_name || "Penjual"}
                  </span>
                </div>
                {product.stock !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stok</span>
                    <span className="font-medium">{product.stock}</span>
                  </div>
                )}
                {product.condition && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kondisi</span>
                    <span className="font-medium">
                      {product.condition === "new" ? "Baru" : "Bekas"}
                    </span>
                  </div>
                )}
                {product.max_participants && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Maks. Peserta</span>
                    <span className="font-medium">{product.max_participants}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
