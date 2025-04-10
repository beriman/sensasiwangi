import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MarketplaceLayout from "./MarketplaceLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SambatanChatButton from "./SambatanChatButton";
import {
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { useAuth } from "../../lib/auth-provider";
import { Input } from "@/components/ui/input";
import { supabase } from "../../lib/supabase";
import QRPaymentModal from "./QRPaymentModal";
import { generateQRPayment } from "@/lib/qrPayment";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";
import SambatanProductInfo from "./SambatanProductInfo";
import SambatanParticipantsList from "./SambatanParticipantsList";
import SambatanJoinForm from "./SambatanJoinForm";
import SambatanDiscussionSection from "./SambatanDiscussionSection";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SambatanPage() {
  const { sambatanId } = useParams<{ sambatanId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sambatan, setSambatan] = useState<Sambatan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [userParticipation, setUserParticipation] = useState<SambatanParticipant | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrPaymentData, setQRPaymentData] = useState<{
    invoiceNumber: string;
    qrCodeUrl: string;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!sambatanId) return;

    const fetchSambatan = async () => {
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

        // Check if user is already a participant
        if (user) {
          const userParticipant = participants.find(
            (p) => p.participant_id === user.id
          );
          if (userParticipant) {
            setUserParticipation(userParticipant);
          }
        }
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
  }, [sambatanId, user, toast]);

  const handleJoinSambatan = async () => {
    if (!user || !sambatanId || !sambatan) return;

    try {
      const { joinSambatan } = await import("@/lib/sambatan");
      const participation = await joinSambatan(sambatanId, user.id, quantity);

      // Update sambatan data
      setSambatan({
        ...sambatan,
        current_quantity: sambatan.current_quantity + quantity,
        participants: [...(sambatan.participants || []), participation],
      });

      setUserParticipation(participation);

      toast({
        title: "Berhasil bergabung",
        description: "Anda telah berhasil bergabung dengan Sambatan ini.",
      });

      // Show QR payment
      handleShowQRPayment();
    } catch (error: any) {
      console.error("Error joining sambatan:", error);
      toast({
        title: "Gagal bergabung",
        description: error.message || "Terjadi kesalahan saat bergabung dengan Sambatan.",
        variant: "destructive",
      });
    }
  };

  // Handle QR Payment generation and display
  const handleShowQRPayment = async () => {
    if (!user || !sambatanId || !sambatan || !userParticipation) return;

    try {
      // Generate QR payment
      const amount = sambatan.product?.price ? sambatan.product.price * userParticipation.quantity : 0;
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

  const handleQRPaymentClose = () => {
    setShowQRPayment(false);
  };

  const handleShareSambatan = (platform: string) => {
    const url = window.location.href;
    const title = sambatan?.product?.name || "Sambatan di Sensasiwangi";

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link disalin",
          description: "Link Sambatan telah disalin ke clipboard.",
        });
        break;
    }
  };

  if (loading) {
    return <LoadingScreen text="Memuat detail Sambatan..." />;
  }

  if (!sambatan) {
    return (
      <MarketplaceLayout title="Sambatan Tidak Ditemukan">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sambatan Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">
            Sambatan yang Anda cari tidak ditemukan atau telah dihapus.
          </p>
          <Link to="/marketplace/sambatan">
            <Button>Kembali ke Daftar Sambatan</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  const isExpired = sambatan.expires_at && new Date(sambatan.expires_at) < new Date();
  const isOpen = sambatan.status === "open" && !isExpired;
  const isInitiator = user && user.id === sambatan.initiator_id;
  const canJoin = isOpen && !userParticipation && !isInitiator;
  const canPayment = userParticipation && userParticipation.payment_status === "pending";

  return (
    <MarketplaceLayout title={sambatan.product?.name || "Detail Sambatan"}>
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/marketplace/sambatan"
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Daftar Sambatan
        </Link>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleShareSambatan("facebook")}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleShareSambatan("twitter")}
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleShareSambatan("whatsapp")}
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleShareSambatan("copy")}
              >
                <LinkIcon className="h-4 w-4 text-gray-500" />
                Salin Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Status Alerts */}
      {!isOpen && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {sambatan.status === "cancelled"
              ? "Sambatan Dibatalkan"
              : isExpired
                ? "Sambatan Kedaluwarsa"
                : sambatan.status === "completed"
                  ? "Sambatan Selesai"
                  : "Sambatan Tertutup"}
          </AlertTitle>
          <AlertDescription>
            {sambatan.status === "cancelled"
              ? "Sambatan ini telah dibatalkan dan tidak menerima peserta baru."
              : isExpired
                ? "Batas waktu Sambatan telah berakhir."
                : sambatan.status === "completed"
                  ? "Sambatan ini telah selesai dan produk sedang dalam proses pengiriman."
                  : "Sambatan ini telah tertutup dan tidak menerima peserta baru."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Info */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="info">Informasi Produk</TabsTrigger>
              <TabsTrigger value="participants">
                Peserta
                <Badge className="ml-2">{sambatan.participants?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="discussion">Diskusi</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <SambatanProductInfo sambatan={sambatan} />
            </TabsContent>

            <TabsContent value="participants">
              <SambatanParticipantsList
                participants={sambatan.participants || []}
                initiatorId={sambatan.initiator_id}
                isInitiator={isInitiator}
              />
            </TabsContent>

            <TabsContent value="discussion">
              <SambatanDiscussionSection sambatanId={sambatan.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Join Form */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <SambatanJoinForm
              sambatan={sambatan}
              userParticipation={userParticipation}
              isInitiator={isInitiator}
              canJoin={canJoin}
              canPayment={canPayment}
              quantity={quantity}
              setQuantity={setQuantity}
              onJoin={handleJoinSambatan}
              onShowPayment={handleShowQRPayment}
            />

            {/* Chat Button - Only show for participants or initiator */}
            {(userParticipation || isInitiator) && (
              <SambatanChatButton
                sambatan={sambatan}
                variant="outline"
                className="w-full mt-4"
              />
            )}
          </div>
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRPayment && qrPaymentData && sambatan.product?.price && (
        <QRPaymentModal
          open={showQRPayment}
          onClose={handleQRPaymentClose}
          orderId={sambatanId || ""}
          invoiceNumber={qrPaymentData.invoiceNumber}
          qrCodeUrl={qrPaymentData.qrCodeUrl}
          amount={sambatan.product.price * (userParticipation?.quantity || 1)}
        />
      )}
    </MarketplaceLayout>
  );
}
