import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShippingTrackingUpdate } from "@/types/marketplace";
import { getTrackingUpdates } from "@/lib/shipping";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Truck, Package, CheckCircle, AlertCircle, Clock } from "lucide-react";

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
  const [trackingUpdates, setTrackingUpdates] = useState<
    ShippingTrackingUpdate[]
  >([]);

  useEffect(() => {
    const fetchTrackingUpdates = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const updates = await getTrackingUpdates(orderId);
        setTrackingUpdates(updates);
      } catch (error) {
        console.error("Error fetching tracking updates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingUpdates();

    // Set up real-time subscription for tracking updates
    const subscription = supabase
      .channel("tracking-updates")
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
  }, [orderId]);

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
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
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
      <CardHeader>
        <CardTitle>Informasi Pengiriman</CardTitle>
      </CardHeader>
      <CardContent>
        {trackingNumber && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500">Nomor Resi:</div>
            <div className="font-medium">{trackingNumber}</div>
            {shippingProvider && (
              <div className="text-sm text-gray-500 mt-1">
                Kurir: {shippingProvider}
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
                    <div className="text-sm font-medium">{update.status}</div>
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
