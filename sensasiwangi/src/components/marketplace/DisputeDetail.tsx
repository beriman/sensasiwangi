// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { useParams, Link, useNavigate } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { id } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import {
  getDispute,
  getDisputeMessages,
  addDisputeMessage,
} from "../../lib/dispute";
// @ts-ignore
import { MarketplaceDispute, DisputeMessage } from "../../types/dispute";

const DisputeDetail = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const [dispute, setDispute] = useState<MarketplaceDispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisputeData = async () => {
      if (!disputeId) return;

      try {
        setLoading(true);
        const disputeData = await getDispute(disputeId);
        if (!disputeData) {
          toast({
            title: "Error",
            description: "Sengketa tidak ditemukan.",
            variant: "destructive",
          });
          navigate("/marketplace/disputes");
          return;
        }
        setDispute(disputeData);

        const messagesData = await getDisputeMessages(disputeId);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching dispute data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data sengketa. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDisputeData();

    // Set up realtime subscription for messages
    const messagesSubscription = supabase
      .channel("dispute-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "marketplace_dispute_messages",
          filter: `dispute_id=eq.${disputeId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from("marketplace_dispute_messages")
            .select(
              `
              *,
              sender:sender_id(full_name, avatar_url)
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        },
      )
      .subscribe();

    // Set up realtime subscription for dispute status changes
    const disputeSubscription = supabase
      .channel("dispute-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "marketplace_disputes",
          filter: `id=eq.${disputeId}`,
        },
        async (payload) => {
          // Fetch the complete dispute with related info
          const updatedDispute = await getDispute(disputeId);
          if (updatedDispute) {
            setDispute(updatedDispute);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(disputeSubscription);
    };
  }, [disputeId, toast, navigate]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !disputeId) return;

    try {
      setSendingMessage(true);
      await addDisputeMessage(disputeId, messageText);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved_buyer":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai (Pembeli)
          </Badge>
        );
      case "resolved_seller":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai (Penjual)
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <ShieldAlert className="w-3 h-3 mr-1" /> Dalam Peninjauan
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat data sengketa..." />
      </div>
    );
  }

  if (!dispute) {
    return (
      <Card className="p-6 text-center bg-white border border-gray-100 rounded-lg">
        <p className="text-gray-500">Sengketa tidak ditemukan.</p>
        <Link
          to="/marketplace/disputes"
          className="mt-4 inline-block text-purple-600 hover:underline"
        >
          Kembali ke Daftar Sengketa
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Link
          to="/marketplace/disputes"
          className="flex items-center text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Daftar Sengketa
        </Link>
      </div>

      <Card className="bg-white border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              Detail Sengketa
            </CardTitle>
            {getStatusBadge(dispute.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Informasi Transaksi
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium text-gray-900 mb-1">
                  {dispute.transaction?.product_name}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  ID Transaksi: {dispute.transaction_id}
                </p>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Pembeli</p>
                    <p className="font-medium">
                      {dispute.transaction?.buyer?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Penjual</p>
                    <p className="font-medium">
                      {dispute.transaction?.seller?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jumlah</p>
                    <p className="font-medium">
                      Rp{dispute.transaction?.amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Detail Sengketa
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-3">
                  <p className="text-gray-500 text-sm">Diajukan oleh</p>
                  <p className="font-medium">
                    {dispute.initiator?.full_name} (
                    {formatDistanceToNow(new Date(dispute.created_at), {
                      addSuffix: true,
                      locale: id,
                    })}
                    )
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Alasan</p>
                  <p className="mt-1 text-gray-900">{dispute.reason}</p>
                </div>
                {dispute.admin_notes && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded">
                    <p className="text-gray-500 text-sm">Catatan Admin</p>
                    <p className="mt-1 text-gray-900">{dispute.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Diskusi Sengketa
            </h3>

            <div className="bg-gray-50 rounded-md p-4 h-[400px] overflow-y-auto flex flex-col space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>
                    Belum ada pesan. Mulai diskusi untuk menyelesaikan sengketa.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isCurrentUser
                            ? "bg-purple-100 text-purple-900"
                            : message.is_from_admin
                              ? "bg-amber-100 text-amber-900"
                              : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage
                              src={
                                message.sender?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
                              }
                              alt={message.sender?.full_name || ""}
                            />
                            <AvatarFallback>
                              {message.sender?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {message.is_from_admin
                              ? "Admin"
                              : message.sender?.full_name || "Pengguna"}
                          </span>
                          <span className="text-xs ml-2 text-gray-500">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-line">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {dispute.status !== "resolved_buyer" &&
              dispute.status !== "resolved_seller" &&
              dispute.status !== "rejected" && (
                <div className="mt-3 flex">
                  <Textarea
                    placeholder="Ketik pesan Anda di sini..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 resize-none"
                    disabled={sendingMessage}
                  />
                  <Button
                    className="ml-2 bg-purple-600 hover:bg-purple-700"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

            {(dispute.status === "resolved_buyer" ||
              dispute.status === "resolved_seller" ||
              dispute.status === "rejected") && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md text-center text-gray-500">
                <p>
                  Sengketa ini telah{" "}
                  {dispute.status === "rejected" ? "ditolak" : "diselesaikan"}{" "}
                  dan diskusi telah ditutup.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisputeDetail;


