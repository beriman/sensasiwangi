import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import MarketplaceLayout from "./MarketplaceLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  ShoppingBag,
  Upload,
  AlertCircle,
  CreditCard,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Link as LinkIcon,
  Timer,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { Input } from "@/components/ui/input";
import { supabase } from "../../../supabase/supabase";
import NotificationCenter from "../forum/NotificationCenter";
import QRPaymentModal from "./QRPaymentModal";
import { generateQRPayment } from "@/lib/qrPayment";

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
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrPaymentData, setQRPaymentData] = useState<{
    invoiceNumber: string;
    qrCodeUrl: string;
  } | null>(null);

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

    // Set up real-time subscription for sambatan updates
    if (sambatanId && user) {
      const sambatanSubscription = supabase
        .channel(`sambatan_${sambatanId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sambatan",
            filter: `id=eq.${sambatanId}`,
          },
          (payload) => {
            // Update the sambatan data when it changes
            const updatedSambatan = payload.new as any;
            setSambatan((prev) => {
              if (!prev) return prev;
              return { ...prev, ...updatedSambatan };
            });

            // Refresh participants if status changes
            if (payload.old.status !== updatedSambatan.status) {
              fetchSambatan();

              // Show toast notification for status change
              if (updatedSambatan.status === "closed") {
                toast({
                  title: "Sambatan Tertutup",
                  description:
                    "Kuota Sambatan telah terpenuhi. Silakan lakukan pembayaran.",
                });
              } else if (updatedSambatan.status === "completed") {
                toast({
                  title: "Sambatan Selesai",
                  description:
                    "Semua peserta telah melakukan pembayaran. Produk akan segera dikirim.",
                });
              }
            }
          },
        )
        .subscribe();

      // Set up real-time subscription for new participants
      const participantsSubscription = supabase
        .channel(`sambatan_participants_${sambatanId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "sambatan_participants",
            filter: `sambatan_id=eq.${sambatanId}`,
          },
          (payload) => {
            // Refresh the sambatan data when a new participant joins
            fetchSambatan();

            // Show toast notification for new participant
            if (user.id === sambatan?.initiator_id) {
              const newParticipant = payload.new as any;
              toast({
                title: "Peserta Baru Bergabung",
                description: `Peserta baru telah bergabung dengan Sambatan untuk ${sambatan?.product?.name}`,
              });

              // Play notification sound
              const audio = new Audio("/notification.mp3");
              audio
                .play()
                .catch((e) =>
                  console.error("Error playing notification sound:", e),
                );
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sambatan_participants",
            filter: `sambatan_id=eq.${sambatanId}`,
          },
          (payload) => {
            // Refresh the sambatan data when a participant's status changes
            fetchSambatan();

            // Show toast notification for payment status change
            const updatedParticipant = payload.new as any;
            if (
              updatedParticipant.participant_id === user.id &&
              payload.old.payment_status !== updatedParticipant.payment_status
            ) {
              if (updatedParticipant.payment_status === "verified") {
                toast({
                  title: "Pembayaran Terverifikasi",
                  description: "Pembayaran Anda telah diverifikasi oleh admin.",
                });
              } else if (updatedParticipant.payment_status === "cancelled") {
                toast({
                  title: "Pembayaran Dibatalkan",
                  description:
                    "Pembayaran Anda telah dibatalkan. Silakan hubungi admin untuk informasi lebih lanjut.",
                  variant: "destructive",
                });
              }
            }
          },
        )
        .subscribe();

      return () => {
        sambatanSubscription.unsubscribe();
        participantsSubscription.unsubscribe();
      };
    }
  }, [sambatanId, toast, user]);

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

  // Share to social media platforms
  const shareToSocialMedia = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(
      `Yuk gabung Sambatan untuk ${sambatan.product.name}!`,
    );
    const text = encodeURIComponent(
      `Ayo bergabung dengan saya untuk membeli ${sambatan.product.name} bersama-sama di Sensasiwangi. Masih tersisa ${remainingSlots > 0 ? remainingSlots : 0} slot!`,
    );

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");

      toast({
        title: "Link dibagikan!",
        description: `Link Sambatan berhasil dibagikan ke ${platform}.`,
      });
    }
  };

  // Use Web Share API if available
  const useNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Sambatan untuk ${sambatan.product.name}`,
          text: `Ayo bergabung dengan saya untuk membeli ${sambatan.product.name} bersama-sama di Sensasiwangi. Masih tersisa ${remainingSlots > 0 ? remainingSlots : 0} slot!`,
          url: window.location.href,
        })
        .then(() => {
          toast({
            title: "Berhasil dibagikan!",
            description: "Link Sambatan berhasil dibagikan.",
          });
        })
        .catch((error) => {
          console.error("Error sharing:", error);
          toast({
            title: "Gagal membagikan",
            description: "Terjadi kesalahan saat membagikan link.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Tidak didukung",
        description:
          "Fitur berbagi tidak didukung di perangkat ini. Silakan gunakan opsi lain.",
        variant: "destructive",
      });
    }
  };

  const [joining, setJoining] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userParticipation, setUserParticipation] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is a participant
  useEffect(() => {
    if (sambatan?.participants && user) {
      const participation = sambatan.participants.find(
        (p: any) => p.participant_id === user.id,
      );
      setUserParticipation(participation || null);
    }
  }, [sambatan, user]);

  const handleJoinSambatan = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk bergabung dengan Sambatan.",
        variant: "destructive",
      });
      return;
    }

    if (!sambatanId) return;

    // Check if sambatan is expired
    if (sambatan.expires_at && new Date(sambatan.expires_at) < new Date()) {
      toast({
        title: "Sambatan Kedaluwarsa",
        description: "Sambatan ini telah kedaluwarsa dan tidak dapat diikuti.",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoining(true);
      const { joinSambatan } = await import("@/lib/sambatan");
      await joinSambatan(sambatanId, user.id, quantity);

      toast({
        title: "Berhasil bergabung!",
        description: `Anda telah berhasil bergabung dengan Sambatan untuk ${quantity} item.`,
      });

      // Refresh the sambatan data
      const { getSambatan, getSambatanParticipants } = await import(
        "@/lib/sambatan"
      );
      const sambatanData = await getSambatan(sambatanId);
      const participants = await getSambatanParticipants(sambatanId);
      setSambatan({ ...sambatanData, participants });
    } catch (error: any) {
      console.error("Error joining sambatan:", error);
      toast({
        title: "Gagal bergabung",
        description:
          error.message || "Terjadi kesalahan saat bergabung dengan Sambatan.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Handle QR Payment generation and display
  const handleShowQRPayment = async () => {
    if (!user || !sambatanId) return;

    try {
      // Generate QR payment
      const amount = sambatan.product.price * userParticipation.quantity;
      const { invoiceNumber, qrCodeUrl } = await generateQRPayment(
        sambatanId,
        amount,
        user.id,
      );

      setQRPaymentData({ invoiceNumber, qrCodeUrl });
      setShowQRPayment(true);
    } catch (error: any) {
      console.error("Error generating QR payment:", error);
      toast({
        title: "Gagal membuat QR payment",
        description:
          error.message || "Terjadi kesalahan saat membuat QR payment.",
        variant: "destructive",
      });
    }
  };

  // Handle QR Payment modal close
  const handleQRPaymentClose = () => {
    setShowQRPayment(false);

    // Refresh sambatan data to get updated payment status
    if (sambatanId) {
      const { getSambatan, getSambatanParticipants } = import(
        "@/lib/sambatan"
      ).then((module) => {
        module.getSambatan(sambatanId).then((sambatanData) => {
          if (sambatanData) {
            module.getSambatanParticipants(sambatanId).then((participants) => {
              setSambatan({ ...sambatanData, participants });
            });
          }
        });
      });
    }
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

  // Check if sambatan is expired
  const isExpired =
    sambatan.expires_at && new Date(sambatan.expires_at) < new Date();

  // Handle file upload for payment proof
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !e.target.files ||
      e.target.files.length === 0 ||
      !sambatanId ||
      !user
    ) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `payment_proofs/${fileName}`;

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("sambatan")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("sambatan").getPublicUrl(filePath);

      // Update payment proof in database
      const { updatePaymentStatus } = await import("@/lib/sambatan");
      await updatePaymentStatus(sambatanId, user.id, "pending", publicUrl);

      toast({
        title: "Bukti pembayaran berhasil diupload",
        description: "Admin akan memverifikasi pembayaran Anda segera.",
      });

      // Refresh sambatan data
      const { getSambatan, getSambatanParticipants } = await import(
        "@/lib/sambatan"
      );
      const sambatanData = await getSambatan(sambatanId);
      const participants = await getSambatanParticipants(sambatanId);
      setSambatan({ ...sambatanData, participants });
    } catch (error: any) {
      console.error("Error uploading payment proof:", error);
      toast({
        title: "Gagal mengupload bukti pembayaran",
        description:
          error.message ||
          "Terjadi kesalahan saat mengupload bukti pembayaran.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Admin function to verify payment
  const handleVerifyPayment = async (
    participantId: string,
    isVerified: boolean,
  ) => {
    if (!sambatanId || !user) return;

    try {
      const { verifyPayment } = await import("@/lib/sambatan");
      await verifyPayment(sambatanId, participantId, isVerified);

      toast({
        title: isVerified ? "Pembayaran diverifikasi" : "Pembayaran dibatalkan",
        description: isVerified
          ? "Pembayaran telah berhasil diverifikasi."
          : "Pembayaran telah dibatalkan.",
      });

      // Refresh sambatan data
      const { getSambatan, getSambatanParticipants } = await import(
        "@/lib/sambatan"
      );
      const sambatanData = await getSambatan(sambatanId);
      const participants = await getSambatanParticipants(sambatanId);
      setSambatan({ ...sambatanData, participants });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Gagal memverifikasi pembayaran",
        description:
          error.message || "Terjadi kesalahan saat memverifikasi pembayaran.",
        variant: "destructive",
      });
    }
  };

  return (
    <MarketplaceLayout
      title="Detail Sambatan"
      subtitle="Beli bersama dengan komunitas Sensasiwangi"
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/marketplace"
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Marketplace
        </Link>
        <div className="flex items-center">
          <NotificationCenter />
        </div>
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
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        sambatan.status === "open"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : sambatan.status === "completed"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : sambatan.status === "cancelled"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {sambatan.status === "open"
                        ? "Terbuka"
                        : sambatan.status === "completed"
                          ? "Selesai"
                          : sambatan.status === "cancelled"
                            ? "Dibatalkan"
                            : "Tertutup"}
                    </Badge>
                    {sambatan.status === "closed" && (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        Menunggu Pembayaran
                      </Badge>
                    )}
                  </div>
                </div>

                {sambatan.expires_at && sambatan.status === "open" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Berakhir Pada</p>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm">
                        {new Date(sambatan.expires_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                )}

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
                  <div className="mb-2 relative">
                    <Progress value={progress} className="h-4 rounded-md" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-md">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {sambatan.current_quantity} dari{" "}
                      {sambatan.target_quantity} peserta
                    </span>
                    <span className="text-purple-600 font-medium">
                      {remainingSlots > 0
                        ? `${remainingSlots} slot tersisa`
                        : "Kuota terpenuhi"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Bagikan Sambatan</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center"
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="px-3">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => shareToSocialMedia("facebook")}
                          className="cursor-pointer"
                        >
                          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                          Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => shareToSocialMedia("twitter")}
                          className="cursor-pointer"
                        >
                          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                          Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => shareToSocialMedia("whatsapp")}
                          className="cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => shareToSocialMedia("telegram")}
                          className="cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Telegram
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={useNativeShare}
                          className="cursor-pointer"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Bagikan...
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Show different UI based on user participation status */}
                {!user ? (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium mb-2 text-center">
                      Silakan login untuk bergabung dengan Sambatan
                    </p>
                  </div>
                ) : userParticipation ? (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">
                        Status Pembayaran Anda
                      </p>
                      <Badge
                        className={
                          userParticipation.payment_status === "verified"
                            ? "bg-green-100 text-green-800 flex items-center gap-1"
                            : userParticipation.payment_status === "cancelled"
                              ? "bg-red-100 text-red-800 flex items-center gap-1"
                              : "bg-yellow-100 text-yellow-800 flex items-center gap-1"
                        }
                      >
                        {userParticipation.payment_status === "verified" && (
                          <Check className="h-3 w-3" />
                        )}
                        {userParticipation.payment_status === "cancelled" && (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {userParticipation.payment_status === "pending" && (
                          <Clock className="h-3 w-3" />
                        )}
                        {userParticipation.payment_status === "verified"
                          ? "Pembayaran Terverifikasi"
                          : userParticipation.payment_status === "cancelled"
                            ? "Pembayaran Dibatalkan"
                            : "Menunggu Pembayaran"}
                      </Badge>
                    </div>

                    {/* Status timeline */}
                    <div className="mb-4 relative pt-2">
                      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="relative flex items-center mb-3">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${userParticipation ? "bg-green-500 text-white" : "bg-gray-200"}`}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">
                            Bergabung Sambatan
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              userParticipation.created_at,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-center mb-3">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${userParticipation.payment_status !== "pending" ? "bg-green-500 text-white" : userParticipation.payment_proof ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
                        >
                          {userParticipation.payment_status !== "pending" ? (
                            <Check className="h-3 w-3" />
                          ) : userParticipation.payment_proof ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <span className="text-xs">2</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">Pembayaran</p>
                          <p className="text-xs text-gray-500">
                            {userParticipation.payment_proof
                              ? "Menunggu verifikasi"
                              : "Belum dibayar"}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-center">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${sambatan.status === "completed" ? "bg-green-500 text-white" : "bg-gray-200"}`}
                        >
                          {sambatan.status === "completed" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <span className="text-xs">3</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">
                            Sambatan Selesai
                          </p>
                          <p className="text-xs text-gray-500">
                            {sambatan.status === "completed"
                              ? "Produk siap dikirim"
                              : "Menunggu semua pembayaran"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {userParticipation.payment_status === "pending" && (
                      <>
                        <div className="flex space-x-2 mb-3">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <>
                                <LoadingSpinner className="h-4 w-4 mr-2" />
                                Mengupload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Bukti Transfer
                              </>
                            )}
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                            onClick={() => handleShowQRPayment()}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Bayar dengan QRIS
                          </Button>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        {userParticipation.payment_proof && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-2">
                              Bukti pembayaran Anda (menunggu verifikasi)
                            </p>
                            <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden mb-2">
                              <img
                                src={userParticipation.payment_proof}
                                alt="Bukti pembayaran"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 mb-1">
                                Instruksi Pembayaran
                              </p>
                              <p className="text-xs text-blue-700 mb-2">
                                Silakan bayar dengan QRIS atau transfer ke
                                rekening berikut:
                              </p>
                              <div className="bg-white p-2 rounded border border-blue-200 mb-2">
                                <p className="text-xs font-medium mb-1">
                                  Bank BCA: 1234567890
                                </p>
                                <p className="text-xs font-medium mb-1">
                                  a.n. Sensasi Wangi Indonesia
                                </p>
                                <p className="text-xs font-medium">
                                  Jumlah:{" "}
                                  {formatPrice(
                                    sambatan.product.price *
                                      userParticipation.quantity,
                                  )}
                                </p>
                              </div>
                              <p className="text-xs text-blue-700">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Pastikan jumlah transfer sesuai agar verifikasi
                                dapat dilakukan dengan cepat
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : sambatan.status === "open" &&
                  remainingSlots > 0 &&
                  (!sambatan.expires_at ||
                    new Date(sambatan.expires_at) > new Date()) ? (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium mb-2">
                      Gabung Sambatan ({remainingSlots} slot tersisa)
                    </p>
                    {sambatan.expires_at && (
                      <p className="text-xs text-yellow-600 mb-2 flex items-center">
                        <Timer className="h-3 w-3 mr-1" />
                        Berakhir pada{" "}
                        {new Date(sambatan.expires_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
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
                      disabled={joining}
                    >
                      {joining ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Gabung Sambatan
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        {sambatan.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : sambatan.status === "closed" ? (
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                        ) : sambatan.status === "cancelled" ? (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        ) : isExpired ? (
                          <Timer className="h-5 w-5 text-red-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className="text-sm font-medium">
                          {sambatan.status === "completed"
                            ? "Sambatan telah selesai"
                            : sambatan.status === "closed"
                              ? "Sambatan tertutup - menunggu pembayaran"
                              : sambatan.status === "cancelled"
                                ? "Sambatan dibatalkan"
                                : isExpired
                                  ? "Sambatan kedaluwarsa"
                                  : "Tidak ada slot tersisa"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        {sambatan.status === "completed"
                          ? "Semua peserta telah melakukan pembayaran. Produk akan segera dikirim."
                          : sambatan.status === "closed"
                            ? "Kuota peserta telah terpenuhi. Menunggu semua peserta melakukan pembayaran."
                            : sambatan.status === "cancelled"
                              ? "Sambatan ini telah dibatalkan karena tidak mencapai target peserta dalam waktu yang ditentukan."
                              : isExpired
                                ? "Sambatan ini telah kedaluwarsa dan tidak dapat diikuti lagi."
                                : "Sambatan ini sudah tidak menerima peserta baru."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Peserta Sambatan ({sambatan.participants.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>
                      {
                        sambatan.participants.filter(
                          (p: any) => p.payment_status === "verified",
                        ).length
                      }{" "}
                      Terverifikasi
                    </span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    <span>
                      {
                        sambatan.participants.filter(
                          (p: any) => p.payment_status === "pending",
                        ).length
                      }{" "}
                      Menunggu
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sambatan.participants.map((participant: any) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-0 ${participant.participant_id === user?.id ? "bg-purple-50 -mx-6 px-6" : ""}`}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage
                          src={participant.participant?.avatar_url}
                          alt={participant.participant?.full_name}
                        />
                        <AvatarFallback>
                          {participant.participant?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {participant.participant?.full_name}
                          {user &&
                            participant.participant_id === user.id &&
                            " (Anda)"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.quantity} item
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.payment_proof && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() =>
                            window.open(participant.payment_proof, "_blank")
                          }
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Badge
                        className={
                          participant.payment_status === "verified"
                            ? "bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1"
                            : participant.payment_status === "cancelled"
                              ? "bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1"
                        }
                      >
                        {participant.payment_status === "verified" && (
                          <Check className="h-3 w-3" />
                        )}
                        {participant.payment_status === "cancelled" && (
                          <XCircle className="h-3 w-3" />
                        )}
                        {participant.payment_status === "pending" && (
                          <Clock className="h-3 w-3" />
                        )}
                        {participant.payment_status === "verified"
                          ? "Terverifikasi"
                          : participant.payment_status === "cancelled"
                            ? "Dibatalkan"
                            : "Menunggu"}
                      </Badge>

                      {/* Admin verification buttons - only show for pending payments */}
                      {user?.id === sambatan.initiator_id &&
                        participant.payment_status === "pending" &&
                        participant.payment_proof && (
                          <div className="flex gap-1 ml-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100"
                              title="Verifikasi pembayaran"
                              onClick={() =>
                                handleVerifyPayment(
                                  participant.participant_id,
                                  true,
                                )
                              }
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 bg-red-50 hover:bg-red-100"
                              title="Tolak pembayaran"
                              onClick={() =>
                                handleVerifyPayment(
                                  participant.participant_id,
                                  false,
                                )
                              }
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRPayment && qrPaymentData && (
        <QRPaymentModal
          open={showQRPayment}
          onClose={handleQRPaymentClose}
          orderId={sambatanId || ""}
          invoiceNumber={qrPaymentData.invoiceNumber}
          qrCodeUrl={qrPaymentData.qrCodeUrl}
          amount={sambatan.product.price * userParticipation.quantity}
        />
      )}
    </MarketplaceLayout>
  );
}
