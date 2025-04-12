// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Separator } from "../../components/ui/separator";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import {
  ShoppingBag,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
// @ts-ignore
import TrackingInfo from "./TrackingInfo";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { id } from "date-fns/locale";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";

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
    weight?: number;
  };
  items?: Array<{
    product_id: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OrderTrackingProps {
  orderId: string;
}

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const fetchOrder = async () => {
    try {
      setRefreshing(true);

      // Fetch order from database
      const { data, error } = await supabase
        .from("marketplace_orders")
        .select(
          `
          *,
          shipping_provider:shipping_provider_id(name, code),
          items
        `,
        )
        .eq("id", orderId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Fetch product details for the first item
        if (data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          const { data: productData } = await supabase
            .from("marketplace_products")
            .select("name, image_url, weight")
            .eq("id", firstItem.product_id)
            .single();

          setOrder({
            ...data,
            product: productData || undefined,
          });
        } else {
          setOrder(data);
        }
      } else {
        // If no data from database, create mock data
        createMockOrder();
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      // Create mock data if error
      createMockOrder();
      toast({
        title: "Error",
        description: "Gagal memuat informasi pesanan. Menggunakan data contoh.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createMockOrder = () => {
    // Create mock order data
    setOrder({
      id: orderId,
      order_number: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      total_price: 250000,
      status: "processing",
      created_at: new Date().toISOString(),
      shipping_provider_id: "jne",
      shipping_cost: 15000,
      shipping_tracking_number: `JNE${Math.floor(10000000 + Math.random() * 90000000)}`,
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
        weight: 500,
      },
      items: [
        {
          product_id: "mock-product-id",
          quantity: 1,
          price: 235000,
          subtotal: 235000,
        },
      ],
    });
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId, toast]);

  const handleRefresh = () => {
    fetchOrder();
  };

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

  // Calculate quantity from items
  const totalQuantity =
    order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detail Pesanan #{order.order_number}</CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusBadge(order.status)}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
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
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>{totalQuantity} item</span>
                  {order.product?.weight && (
                    <span className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {((order.product.weight * totalQuantity) / 1000).toFixed(
                        1,
                      )}{" "}
                      kg
                    </span>
                  )}
                </div>
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
                <span className="text-gray-600">
                  Pengiriman ({order.shipping_provider?.name})
                </span>
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

        {order.status === "shipped" &&
          order.shipping_status === "delivered" && (
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={async () => {
                try {
                  // Update order status to delivered
                  const { error } = await supabase
                    .from("marketplace_orders")
                    .update({
                      status: "delivered",
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", order.id);

                  if (error) throw error;

                  // Update local state
                  setOrder((prev) =>
                    prev ? { ...prev, status: "delivered" } : null,
                  );

                  toast({
                    title: "Pesanan Dikonfirmasi",
                    description:
                      "Terima kasih telah mengkonfirmasi penerimaan pesanan.",
                  });
                } catch (error) {
                  console.error("Error confirming order:", error);
                  toast({
                    title: "Error",
                    description:
                      "Gagal mengkonfirmasi pesanan. Silakan coba lagi.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Konfirmasi Penerimaan
            </Button>
          )}
      </div>
    </div>
  );
}


