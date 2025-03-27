import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import {
  MarketplaceProduct,
  ShippingAddress,
  ShippingRate,
} from "@/types/marketplace";
import { getUserShippingAddress } from "@/lib/shipping";
import ShippingAddressForm from "./ShippingAddressForm";
import ShippingOptions from "./ShippingOptions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MapPin, CreditCard, Truck, ShoppingBag } from "lucide-react";

interface CheckoutFormProps {
  product: MarketplaceProduct;
  quantity: number;
  onCheckoutComplete?: () => void;
}

export default function CheckoutForm({
  product,
  quantity,
  onCheckoutComplete,
}: CheckoutFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress | null>(null);
  const [selectedShippingRate, setSelectedShippingRate] =
    useState<ShippingRate | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!user) return;

      try {
        setAddressLoading(true);
        const address = await getUserShippingAddress(user.id);
        setShippingAddress(address);
      } catch (error) {
        console.error("Error fetching user address:", error);
      } finally {
        setAddressLoading(false);
        setLoading(false);
      }
    };

    fetchUserAddress();
  }, [user]);

  const handleAddressSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
  };

  const handleShippingSelect = (rate: ShippingRate) => {
    setSelectedShippingRate(rate);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk melanjutkan checkout.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!shippingAddress) {
      toast({
        title: "Alamat Diperlukan",
        description: "Silakan isi alamat pengiriman terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedShippingRate) {
      toast({
        title: "Metode Pengiriman Diperlukan",
        description: "Silakan pilih metode pengiriman terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingOrder(true);
      // Here you would create the order in your database
      // For now, we'll just simulate a successful order

      setTimeout(() => {
        toast({
          title: "Pesanan Berhasil",
          description:
            "Pesanan Anda telah berhasil dibuat. Silakan lakukan pembayaran.",
        });

        if (onCheckoutComplete) {
          onCheckoutComplete();
        }

        // Redirect to payment page (this would be implemented later)
        navigate("/marketplace/payment/123");
      }, 1500);
    } catch (error) {
      console.error("Error processing order:", error);
      toast({
        title: "Error",
        description: "Gagal memproses pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(false);
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
        <LoadingSpinner text="Memuat checkout..." />
      </div>
    );
  }

  const subtotal = product.price * quantity;
  const shippingCost = selectedShippingRate?.price || 0;
  const total = subtotal + shippingCost;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Shipping & Payment */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Alamat Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent>
            {addressLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner text="Memuat alamat..." />
              </div>
            ) : shippingAddress ? (
              <div className="space-y-2">
                <div className="p-4 border rounded-md">
                  <div className="font-medium">
                    {user?.user_metadata?.full_name || "Pengguna"}
                  </div>
                  <div className="text-gray-600">{shippingAddress.phone}</div>
                  <div className="text-gray-600">
                    {shippingAddress.address}, {shippingAddress.city},{" "}
                    {shippingAddress.province}, {shippingAddress.postal_code}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShippingAddress(null)}
                >
                  Ubah Alamat
                </Button>
              </div>
            ) : (
              <ShippingAddressForm
                onAddressSubmit={handleAddressSubmit}
                buttonText="Simpan & Gunakan Alamat Ini"
              />
            )}
          </CardContent>
        </Card>

        {shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Metode Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShippingOptions
                originCity={product.seller?.city || "Jakarta Pusat"}
                destinationCity={shippingAddress.city}
                onShippingSelect={handleShippingSelect}
                selectedRateId={selectedShippingRate?.id}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transfer">
              <TabsList className="w-full">
                <TabsTrigger value="transfer" className="flex-1">
                  Transfer Bank
                </TabsTrigger>
                <TabsTrigger value="qris" className="flex-1">
                  QRIS
                </TabsTrigger>
              </TabsList>
              <TabsContent value="transfer" className="pt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-md">
                    <div className="font-medium">Bank BCA</div>
                    <div className="text-gray-600">1234567890</div>
                    <div className="text-gray-600">
                      a.n. Sensasi Wangi Indonesia
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Setelah melakukan pembayaran, Anda perlu mengunggah bukti
                    pembayaran.
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="qris" className="pt-4">
                <div className="text-center space-y-4">
                  <div className="bg-gray-100 p-8 rounded-md inline-block mx-auto">
                    <div className="text-gray-400 text-center">
                      [QR Code Placeholder]
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Scan QR code di atas menggunakan aplikasi e-wallet atau
                    mobile banking Anda.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium line-clamp-1">{product.name}</div>
                <div className="text-sm text-gray-500">{quantity} item</div>
                <div className="font-medium text-purple-600">
                  {formatPrice(product.price)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pengiriman</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleCheckout}
              disabled={
                !shippingAddress || !selectedShippingRate || processingOrder
              }
            >
              {processingOrder ? "Memproses..." : "Buat Pesanan"}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              Dengan menekan tombol di atas, Anda menyetujui Syarat & Ketentuan
              dan Kebijakan Privasi kami.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
