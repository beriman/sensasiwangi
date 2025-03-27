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
import {
  generateQRPayment,
  getAvailablePaymentMethods,
  PaymentMethod,
} from "@/lib/qrPayment";
import ShippingAddressForm from "./ShippingAddressForm";
import ShippingOptions from "./ShippingOptions";
import QRPaymentModal from "./QRPaymentModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  MapPin,
  CreditCard,
  Truck,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("QRIS");
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: string; name: string; logo_url: string }>
  >([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

  // QR Payment Modal
  const [qrPaymentModalOpen, setQRPaymentModalOpen] = useState(false);
  const [qrPaymentData, setQRPaymentData] = useState<{
    orderId: string;
    invoiceNumber: string;
    qrCodeUrl: string;
    amount: number;
    paymentMethod: PaymentMethod;
    expiryTime?: string;
    transactionId?: string;
  } | null>(null);

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

    const fetchPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true);
        const methods = await getAvailablePaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        // Set default payment methods if there's an error
        setPaymentMethods([
          {
            id: "QRIS",
            name: "QRIS",
            logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=QRIS",
          },
          {
            id: "OVO",
            name: "OVO",
            logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=OVO",
          },
          {
            id: "GOPAY",
            name: "GoPay",
            logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GOPAY",
          },
          {
            id: "DANA",
            name: "DANA",
            logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DANA",
          },
        ]);
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    fetchUserAddress();
    fetchPaymentMethods();
  }, [user]);

  const handleAddressSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
  };

  const handleShippingSelect = (rate: ShippingRate) => {
    setSelectedShippingRate(rate);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const createOrder = async () => {
    if (!user || !shippingAddress || !selectedShippingRate) return null;

    try {
      // Calculate total amount
      const subtotal = product.price * quantity;
      const shippingCost = selectedShippingRate.price;
      const total = subtotal + shippingCost;

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from("marketplace_orders")
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          total_price: total,
          status: "pending",
          shipping_address: shippingAddress,
          shipping_method: selectedShippingRate.service_type,
          shipping_cost: shippingCost,
          payment_method: selectedPaymentMethod,
          items: [
            {
              product_id: product.id,
              quantity: quantity,
              price: product.price,
              subtotal: subtotal,
            },
          ],
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      return orderData;
    } catch (error) {
      console.error("Error in createOrder:", error);
      throw error;
    }
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

      // Check if this is a Sambatan order
      const sambatanId = new URLSearchParams(window.location.search).get(
        "sambatanId",
      );
      const participantId = user.id;

      if (sambatanId) {
        // This is a Sambatan order - check if we have optimized shipping
        const { data: sambatan } = await supabase
          .from("sambatan")
          .select("product_id, initiator:initiator_id(shipping_city)")
          .eq("id", sambatanId)
          .single();

        if (
          sambatan &&
          sambatan.product_id &&
          sambatan.initiator?.shipping_city
        ) {
          // Get optimal shipping for this Sambatan
          const { getOptimalSambatanShipping } = await import("@/lib/shipping");
          const optimalShipping = await getOptimalSambatanShipping(
            sambatanId,
            sambatan.product_id,
            sambatan.initiator.shipping_city,
          );

          // If this participant has an optimized rate and it's different from selected
          if (
            optimalShipping.participantRates[participantId] &&
            optimalShipping.participantRates[participantId].id !==
              selectedShippingRate.id
          ) {
            // Show recommendation to user
            const optimalRate = optimalShipping.participantRates[participantId];
            const savingAmount = selectedShippingRate.price - optimalRate.price;

            if (savingAmount > 0) {
              const useOptimalRate = window.confirm(
                `Kami menemukan opsi pengiriman yang lebih hemat untuk Sambatan ini menggunakan ${optimalRate.provider?.name} ${optimalRate.service_type}. ` +
                  `Anda dapat menghemat Rp${savingAmount.toLocaleString()} dengan opsi ini. Gunakan opsi yang direkomendasikan?`,
              );

              if (useOptimalRate) {
                // Use the optimal rate instead
                selectedShippingRate = optimalRate;
              }
            }
          }
        }
      }

      // Create order in database
      const order = await createOrder();

      if (!order) {
        throw new Error("Failed to create order");
      }

      // Calculate total amount
      const subtotal = product.price * quantity;
      const shippingCost = selectedShippingRate.price;
      const total = subtotal + shippingCost;

      // Generate QR payment
      const paymentData = await generateQRPayment(
        order.id,
        total,
        user.id,
        selectedPaymentMethod,
      );

      // Set QR payment data for modal
      setQRPaymentData({
        orderId: order.id,
        invoiceNumber: paymentData.invoiceNumber,
        qrCodeUrl: paymentData.qrCodeUrl,
        amount: total,
        paymentMethod: selectedPaymentMethod,
        expiryTime: paymentData.expiryTime,
        transactionId: paymentData.transactionId,
      });

      // Open QR payment modal
      setQRPaymentModalOpen(true);

      toast({
        title: "Pesanan Berhasil Dibuat",
        description: "Silakan selesaikan pembayaran Anda.",
      });

      if (onCheckoutComplete) {
        onCheckoutComplete();
      }
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

  const handleQRPaymentModalClose = () => {
    setQRPaymentModalOpen(false);
    // Redirect to order tracking page
    if (qrPaymentData?.orderId) {
      navigate(`/marketplace/orders/${qrPaymentData.orderId}`);
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
            <Tabs defaultValue="digital">
              <TabsList className="w-full">
                <TabsTrigger value="digital" className="flex-1">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Pembayaran Digital
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transfer Bank
                </TabsTrigger>
              </TabsList>

              <TabsContent value="digital" className="pt-4">
                {paymentMethodsLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner text="Memuat metode pembayaran..." />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border rounded-md p-3 flex flex-col items-center cursor-pointer transition-all ${selectedPaymentMethod === method.id ? "border-purple-500 bg-purple-50" : "hover:border-gray-400"}`}
                        onClick={() =>
                          handlePaymentMethodSelect(method.id as PaymentMethod)
                        }
                      >
                        <div className="w-12 h-12 mb-2">
                          <img
                            src={
                              method.logo_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${method.id}`
                            }
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {method.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-500">
                  Pembayaran digital memungkinkan Anda membayar langsung
                  menggunakan aplikasi e-wallet atau mobile banking.
                </div>
              </TabsContent>

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

      {/* QR Payment Modal */}
      {qrPaymentData && (
        <QRPaymentModal
          open={qrPaymentModalOpen}
          onClose={handleQRPaymentModalClose}
          orderId={qrPaymentData.orderId}
          invoiceNumber={qrPaymentData.invoiceNumber}
          qrCodeUrl={qrPaymentData.qrCodeUrl}
          amount={qrPaymentData.amount}
          paymentMethod={qrPaymentData.paymentMethod}
          expiryTime={qrPaymentData.expiryTime}
          transactionId={qrPaymentData.transactionId}
        />
      )}
    </div>
  );
}
