import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MarketplaceLayout from "./MarketplaceLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Copy, Check, Users, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";

// Mock data for demonstration
const mockSambatan = {
  id: "samb-123",
  product: {
    id: "prod-123",
    name: "Parfum Sensasi Wangi Melati",
    description: "Parfum dengan aroma melati yang menyegarkan",
    price: 250000,
    image_url:
      "https://images.unsplash.com/photo-1592914610354-fd354ea45e48?w=800&q=80",
    seller: {
      id: "seller-123",
      full_name: "Toko Parfum Nusantara",
      avatar_url:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=TokoParfumNusantara",
    },
  },
  initiator: {
    id: "user-123",
    full_name: "Budi Santoso",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=BudiSantoso",
  },
  target_quantity: 5,
  current_quantity: 2,
  status: "open",
  created_at: "2024-06-15T08:30:00Z",
  participants: [
    {
      id: "part-1",
      user: {
        id: "user-123",
        full_name: "Budi Santoso",
        avatar_url:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=BudiSantoso",
      },
      quantity: 1,
      payment_status: "verified",
      created_at: "2024-06-15T08:30:00Z",
    },
    {
      id: "part-2",
      user: {
        id: "user-456",
        full_name: "Siti Rahayu",
        avatar_url:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=SitiRahayu",
      },
      quantity: 1,
      payment_status: "pending",
      created_at: "2024-06-15T09:15:00Z",
    },
  ],
};

export default function SambatanPage() {
  const { sambatanId } = useParams<{ sambatanId: string }>();
  const [sambatan, setSambatan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSambatan = async () => {
      if (!sambatanId) return;

      try {
        setLoading(true);
        const { getSambatan, getSambatanParticipants } = await import(
          "@/lib/sambatan"
        );
        const sambatanData = await getSambatan(sambatanId);

        if (!sambatanData) {
          toast({
            title: "Sambatan tidak ditemukan",
            description: "Sambatan yang Anda cari tidak ditemukan.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Fetch participants
        const participants = await getSambatanParticipants(sambatanId);
        setSambatan({ ...sambatanData, participants });
      } catch (error) {
        console.error("Error fetching sambatan:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data Sambatan. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSambatan();
  }, [sambatanId, toast]);

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        toast({
          title: "Link disalin!",
          description: "Link Sambatan berhasil disalin ke clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Gagal menyalin link",
          description: "Terjadi kesalahan saat menyalin link.",
          variant: "destructive",
        });
      },
    );
  };

  const handleJoinSambatan = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk bergabung dengan Sambatan.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would send a request to join the sambatan
    toast({
      title: "Fitur dalam pengembangan",
      description: "Fitur bergabung Sambatan sedang dalam pengembangan.",
    });
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
      <MarketplaceLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Memuat data Sambatan..." />
        </div>
      </MarketplaceLayout>
    );
  }

  if (!sambatan) {
    return (
      <MarketplaceLayout>
        <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <p className="text-gray-500">Sambatan tidak ditemukan.</p>
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

  const progress = (sambatan.current_quantity / sambatan.target_quantity) * 100;
  const remainingSlots = sambatan.target_quantity - sambatan.current_quantity;

  return (
    <MarketplaceLayout
      title="Detail Sambatan"
      subtitle="Beli bersama dengan komunitas Sensasiwangi"
    >
      <div className="flex items-center mb-6">
        <Link
          to="/marketplace"
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Product Info */}
        <div className="md:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
              {sambatan.product.image_url ? (
                <img
                  src={sambatan.product.image_url}
                  alt={sambatan.product.name}
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
                    {formatPrice(sambatan.product.price)}
                  </Badge>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {sambatan.product.name}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6 whitespace-pre-line">
                {sambatan.product.description}
              </div>

              <div className="flex items-center space-x-4 mt-8">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={sambatan.product.seller.avatar_url}
                    alt={sambatan.product.seller.full_name}
                  />
                  <AvatarFallback>
                    {sambatan.product.seller.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {sambatan.product.seller.full_name}
                  </p>
                  <p className="text-sm text-gray-500">Penjual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sambatan Info */}
        <div>
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Informasi Sambatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Sambatan</p>
                  <Badge
                    className={
                      sambatan.status === "open"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    }
                  >
                    {sambatan.status === "open" ? "Terbuka" : "Tertutup"}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Inisiator</p>
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage
                        src={sambatan.initiator.avatar_url}
                        alt={sambatan.initiator.full_name}
                      />
                      <AvatarFallback>
                        {sambatan.initiator.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {sambatan.initiator.full_name}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Progress Sambatan
                  </p>
                  <div className="mb-2">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {sambatan.current_quantity} dari{" "}
                      {sambatan.target_quantity} peserta
                    </span>
                    <span className="text-purple-600 font-medium">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Bagikan Sambatan</p>
                  <div className="flex">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" /> Salin Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {sambatan.status === "open" && remainingSlots > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium mb-2">
                      Gabung Sambatan ({remainingSlots} slot tersisa)
                    </p>
                    <div className="flex items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="mx-4 font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2"
                        onClick={() =>
                          setQuantity(Math.min(remainingSlots, quantity + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                      onClick={handleJoinSambatan}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gabung Sambatan
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Peserta Sambatan ({sambatan.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sambatan.participants.map((participant: any) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage
                          src={participant.user.avatar_url}
                          alt={participant.user.full_name}
                        />
                        <AvatarFallback>
                          {participant.user.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {participant.user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.quantity} item
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        participant.payment_status === "verified"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {participant.payment_status === "verified"
                        ? "Terverifikasi"
                        : "Menunggu"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
