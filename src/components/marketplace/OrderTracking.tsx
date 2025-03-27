import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ShoppingBag,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import TrackingInfo from "./TrackingInfo";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  total_price: number;
  status: string;
  created_at: string;
  shipping_provider_id: string;
  shipping_cost: number;
  shipping_tracking_number: string;
  shipping_status: string;
  estimated_delivery_date: string;
  shipping_provider?: {
    name: string;
    code: string;
  };
  product?: {
    name: string;
    image_url: string;
  };
}

interface OrderTrackingProps {
  orderId: string;
}

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
          setOrder({
            id: orderId,
            order_number: "ORD-12345",
            total_price: 250000,
            status: "processing",
            created_at: new Date().toISOString(),
            shipping_provider_id: "123",
            shipping_cost: 15000,
            shipping_tracking_number: "JNE12345678",
            shipping_status: "in_transit",
            estimated_delivery_date: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            shipping_provider: {
              name: "JNE",
              code: "jne",
            },
            product: {
              name: "Parfum Sensasi Wangi",
              image_url:
                "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80",
            },
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: "Gagal memuat informasi pesanan. Silakan coba lagi.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="h-3 w-3 mr-1" /> Menunggu Pembayaran
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Package className="h-3 w-3 mr-1" /> Diproses
          </Badge>
        );
      case "shipped":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Truck className="h-3 w-3 mr-1" /> Dikirim
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Terkirim
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" /> Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat informasi pesanan..." />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Pesanan tidak ditemukan.</p>
        <Button
          variant="link"
          className="mt-2 text-purple-600"
          onClick={() => window.history.back()}
        >
          Kembali
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detail Pesanan #{order.order_number}</CardTitle>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-gray-500">
            Dipesan{" "}
            {formatDistanceToNow(new Date(order.created_at), {
              addSuffix: true,
              locale: id,
            })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {order.product?.image_url ? (
                  <img
                    src={order.product.image_url}
                    alt={order.product?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {order.product?.name || "Produk"}
                </div>
                <div className="text-sm text-gray-500">1 item</div>
              </div>
              <div className="font-medium text-purple-600">
                {formatPrice(order.total_price - order.shipping_cost)}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  {formatPrice(order.total_price - order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pengiriman</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TrackingInfo
        orderId={order.id}
        trackingNumber={order.shipping_tracking_number}
        shippingProvider={order.shipping_provider?.name}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Kembali
        </Button>

        {order.status === "delivered" && (
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              toast({
                title: "Fitur dalam pengembangan",
                description:
                  "Fitur konfirmasi penerimaan sedang dalam pengembangan.",
              });
            }}
          >
            Konfirmasi Penerimaan
          </Button>
        )}
      </div>
    </div>
  );
}
