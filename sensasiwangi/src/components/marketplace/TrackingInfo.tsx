import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShippingTrackingUpdate } from "@/types/marketplace";
import { getTrackingUpdates, getTrackingInfo } from "@/lib/shipping";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";

interface TrackingInfoProps {
  orderId: string;
  trackingNumber?: string;
  shippingProvider?: string;
  className?: string;
}

export default function TrackingInfo({
  orderId,
  trackingNumber,
  shippingProvider,
  className,
}: TrackingInfoProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState<
    ShippingTrackingUpdate[]
  >([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(
    null,
  );

  const fetchTrackingInfo = async () => {
    if (!orderId || !trackingNumber) return;

    try {
      setRefreshing(true);
      // Get tracking updates from our database
      const updates = await getTrackingUpdates(orderId);

      if (updates.length > 0) {
        setTrackingUpdates(updates);
      } else {
        // If no updates in database, try to get from shipping API
        try {
          const providerCode = getProviderCode(shippingProvider || "JNE");
          const trackingInfo = await getTrackingInfo(
            trackingNumber,
            providerCode,
          );

          // Set estimated delivery date
          setEstimatedDelivery(trackingInfo.estimated_delivery);

          // Convert tracking info updates to our format and save to database
          const convertedUpdates = trackingInfo.updates.map(
            (update, index) => ({
              id: `${index}`,
              order_id: orderId,
              status: update.status,
              description: update.description,
              location: update.location,
              timestamp: update.timestamp,
              created_at: update.timestamp,
            }),
          );

          setTrackingUpdates(convertedUpdates);

          // Save updates to database for future reference
          for (const update of convertedUpdates) {
            await supabase.from("shipping_tracking_updates").insert({
              order_id: orderId,
              status: update.status,
              description: update.description,
              location: update.location,
              timestamp: update.timestamp,
            });
          }
        } catch (apiError) {
          console.error("Error fetching from shipping API:", apiError);
          // Create mock data if API fails
          createMockTrackingUpdates();
        }
      }
    } catch (error) {
      console.error("Error fetching tracking updates:", error);
      createMockTrackingUpdates();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Convert provider name to code
  const getProviderCode = (providerName: string): string => {
    const nameToCode: Record<string, string> = {
      JNE: "jne",
      "J&T": "jnt",
      "J&T Express": "jnt",
      SiCepat: "sicepat",
      AnterAja: "anteraja",
      "Pos Indonesia": "pos",
    };

    return nameToCode[providerName] || providerName.toLowerCase();
  };

  const createMockTrackingUpdates = () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const mockUpdates = [
      {
        id: "1",
        order_id: orderId,
        status: "in_transit",
        description: "Paket dalam perjalanan ke kota tujuan",
        location: "Jakarta",
        timestamp: now.toISOString(),
        created_at: now.toISOString(),
      },
      {
        id: "2",
        order_id: orderId,
        status: "processed",
        description: "Paket telah diproses di gudang asal",
        location: "Bandung",
        timestamp: yesterday.toISOString(),
        created_at: yesterday.toISOString(),
      },
      {
        id: "3",
        order_id: orderId,
        status: "picked_up",
        description: "Paket telah diambil oleh kurir",
        location: "Bandung",
        timestamp: twoDaysAgo.toISOString(),
        created_at: twoDaysAgo.toISOString(),
      },
    ];

    setTrackingUpdates(mockUpdates);
    setEstimatedDelivery(
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    );
  };

  useEffect(() => {
    if (orderId && trackingNumber) {
      fetchTrackingInfo();
    }

    // Set up real-time subscription for tracking updates
    if (orderId) {
      const subscription = supabase
        .channel(`tracking-updates-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "shipping_tracking_updates",
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            setTrackingUpdates((prev) => [
              payload.new as ShippingTrackingUpdate,
              ...prev,
            ]);
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [orderId, trackingNumber, shippingProvider]);

  const handleRefresh = () => {
    fetchTrackingInfo();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "in_transit":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "out_for_delivery":
        return <Truck className="h-5 w-5 text-orange-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "picked_up":
        return <Package className="h-5 w-5 text-purple-500" />;
      case "processed":
        return <Package className="h-5 w-5 text-indigo-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "picked_up":
        return "Paket Diambil";
      case "processed":
        return "Diproses";
      case "in_transit":
        return "Dalam Perjalanan";
      case "out_for_delivery":
        return "Pengiriman ke Alamat";
      case "delivered":
        return "Terkirim";
      case "delayed":
        return "Tertunda";
      case "failed_delivery":
        return "Gagal Terkirim";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "picked_up":
      case "processed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_transit":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "out_for_delivery":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "delayed":
      case "failed_delivery":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Informasi Pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner text="Memuat informasi pengiriman..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Informasi Pengiriman</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {trackingNumber && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <div className="text-sm text-gray-500">Nomor Resi:</div>
                <div className="font-medium">{trackingNumber}</div>
              </div>
              {shippingProvider && (
                <div>
                  <div className="text-sm text-gray-500">Kurir:</div>
                  <div className="font-medium">{shippingProvider}</div>
                </div>
              )}
              {trackingUpdates.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500">Status:</div>
                  <Badge
                    variant="outline"
                    className={getStatusColor(trackingUpdates[0].status)}
                  >
                    {getStatusText(trackingUpdates[0].status)}
                  </Badge>
                </div>
              )}
            </div>

            {estimatedDelivery && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">Estimasi Tiba:</div>
                <div className="font-medium text-purple-700">
                  {format(new Date(estimatedDelivery), "EEEE, d MMMM yyyy", {
                    locale: id,
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {trackingUpdates.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Status Pengiriman:</h3>
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-2.5 w-px bg-gray-200"></div>
              <div className="space-y-6">
                {trackingUpdates.map((update, index) => (
                  <div key={update.id} className="relative pl-8">
                    <div className="absolute left-0 p-1 bg-white">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="text-sm font-medium">
                      {getStatusText(update.status)}
                    </div>
                    {update.description && (
                      <div className="text-sm text-gray-600">
                        {update.description}
                      </div>
                    )}
                    <div className="flex text-xs text-gray-500 mt-1">
                      {update.location && (
                        <span className="mr-2">{update.location}</span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(update.timestamp), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>Belum ada informasi pengiriman.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
