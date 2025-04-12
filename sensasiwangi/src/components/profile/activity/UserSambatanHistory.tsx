// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../../../supabase/supabase";
// @ts-ignore
import { useAuth } from "../../../../supabase/auth";
// @ts-ignore
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
// @ts-ignore
import { Card, CardContent } from "../../../components/ui/card";
// @ts-ignore
import { Badge } from "../../../components/ui/badge";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
// @ts-ignore
import { Progress } from "../../../components/ui/progress";
import {
  ShoppingBag,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
// @ts-ignore
import { Sambatan, SambatanParticipant } from "../../../types/marketplace";
// @ts-ignore
import { Link } from "react-router-dom";

interface UserSambatanHistoryProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function UserSambatanHistory({
  userId,
  isOwnProfile = false,
}: UserSambatanHistoryProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initiatedSambatans, setInitiatedSambatans] = useState<Sambatan[]>([]);
  const [participatedSambatans, setParticipatedSambatans] = useState<
    {
      sambatan: Sambatan;
      participation: SambatanParticipant;
    }[]
  >([]);

  useEffect(() => {
    const fetchSambatanHistory = async () => {
      try {
        setLoading(true);

        // Fetch sambatans initiated by the user
        const { data: initiatedData, error: initiatedError } = await supabase
          .from("sambatan")
          .select(
            `
            *,
            initiator:initiator_id(id, full_name, avatar_url),
            product:product_id(*,
              seller:seller_id(id, full_name, avatar_url)
            )
          `,
          )
          .eq("initiator_id", userId)
          .order("created_at", { ascending: false });

        if (initiatedError) throw initiatedError;

        // Fetch sambatans where the user is a participant
        const { data: participationsData, error: participationsError } =
          await supabase
            .from("sambatan_participants")
            .select(
              `
            *,
            participant:participant_id(id, full_name, avatar_url)
          `,
            )
            .eq("participant_id", userId)
            .order("created_at", { ascending: false });

        if (participationsError) throw participationsError;

        // For each participation, fetch the sambatan details
        const participatedSambatansPromises = participationsData.map(
          async (participation) => {
            const { data: sambatanData, error: sambatanError } = await supabase
              .from("sambatan")
              .select(
                `
              *,
              initiator:initiator_id(id, full_name, avatar_url),
              product:product_id(*,
                seller:seller_id(id, full_name, avatar_url)
              )
            `,
              )
              .eq("id", participation.sambatan_id)
              .single();

            if (sambatanError) {
              console.error("Error fetching sambatan:", sambatanError);
              return null;
            }

            return {
              sambatan: sambatanData,
              participation,
            };
          },
        );

        const participatedResults = await Promise.all(
          participatedSambatansPromises,
        );
        const validParticipations = participatedResults.filter(
          (
            result,
          ): result is {
            sambatan: Sambatan;
            participation: SambatanParticipant;
          } => result !== null,
        );

        // Filter out sambatans that the user initiated (to avoid duplicates)
        const filteredParticipations = validParticipations.filter(
          (item) => item.sambatan.initiator_id !== userId,
        );

        setInitiatedSambatans(initiatedData || []);
        setParticipatedSambatans(filteredParticipations);
      } catch (error) {
        console.error("Error fetching sambatan history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSambatanHistory();
    }
  }, [userId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800">Terbuka</Badge>;
      case "closed":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Tertutup</Badge>
        );
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Selesai</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Menunggu Pembayaran
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            Pembayaran Terverifikasi
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800">
            Pembayaran Dibatalkan
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat riwayat Sambatan..." />;
  }

  if (initiatedSambatans.length === 0 && participatedSambatans.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          {isOwnProfile ? "Anda belum" : "Pengguna ini belum"} memiliki riwayat
          Sambatan
        </h3>
        {isOwnProfile && (
          <p className="mt-2 text-sm text-gray-500">
            Mulai berbelanja dengan Sambatan untuk melihat riwayat di sini.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {initiatedSambatans.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-600" />
            Sambatan yang {isOwnProfile ? "Anda" : "Pengguna"} Inisiasi
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {initiatedSambatans.map((sambatan) => {
              const progress =
                (sambatan.current_quantity / sambatan.target_quantity) * 100;

              return (
                <Link
                  to={`/marketplace/sambatan/${sambatan.id}`}
                  key={sambatan.id}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                          {sambatan.product?.image_url ? (
                            <img
                              src={sambatan.product.image_url}
                              alt={sambatan.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {sambatan.product?.name}
                            </h4>
                            {getStatusBadge(sambatan.status)}
                          </div>
                          <div className="mt-1">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                              {sambatan.product?.price &&
                                formatPrice(sambatan.product.price)}
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1">
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                {sambatan.current_quantity} dari{" "}
                                {sambatan.target_quantity} peserta
                              </span>
                              <span className="text-purple-600 font-medium">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Dibuat pada {formatDate(sambatan.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {participatedSambatans.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            Sambatan yang {isOwnProfile ? "Anda" : "Pengguna"} Ikuti
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {participatedSambatans.map((item) => {
              const { sambatan, participation } = item;
              const progress =
                (sambatan.current_quantity / sambatan.target_quantity) * 100;

              return (
                <Link
                  to={`/marketplace/sambatan/${sambatan.id}`}
                  key={`${sambatan.id}-${participation.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                          {sambatan.product?.image_url ? (
                            <img
                              src={sambatan.product.image_url}
                              alt={sambatan.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {sambatan.product?.name}
                            </h4>
                            {getStatusBadge(sambatan.status)}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                              {sambatan.product?.price &&
                                formatPrice(sambatan.product.price)}
                            </Badge>
                            {getPaymentStatusBadge(
                              participation.payment_status,
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="mb-1">
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                {sambatan.current_quantity} dari{" "}
                                {sambatan.target_quantity} peserta
                              </span>
                              <span className="text-purple-600 font-medium">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Bergabung pada{" "}
                              {formatDate(participation.created_at)}
                            </div>
                            <div className="flex items-center">
                              <Avatar className="h-4 w-4 mr-1">
                                <AvatarImage
                                  src={
                                    sambatan.initiator?.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${sambatan.initiator_id}`
                                  }
                                  alt={sambatan.initiator?.full_name || ""}
                                />
                                <AvatarFallback>
                                  {sambatan.initiator?.full_name?.[0] || "S"}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                Inisiator:{" "}
                                {sambatan.initiator?.full_name || "User"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


