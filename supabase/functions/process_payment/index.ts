import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, amount, buyerId, paymentMethod } = await req.json();

    // Validate required parameters
    if (!orderId || !amount || !buyerId || !paymentMethod) {
      throw new Error("Missing required parameters");
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      },
    );

    // Generate a unique transaction ID
    const transactionId =
      `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`.substring(0, 20);

    // Set expiry time (15 minutes from now)
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Process payment based on payment method
    let paymentData = {};
    let paymentCode = "";
    let redirectUrl = "";

    switch (paymentMethod) {
      case "QRIS":
      case "OVO":
      case "GOPAY":
      case "DANA":
      case "LINKAJA":
      case "SHOPEEPAY":
        // For QR-based payments, generate a QR code URL
        // In a real implementation, this would call an external payment gateway API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SENSASIWANGI:${transactionId}:${amount}:${paymentMethod}`;
        paymentData = {
          qrCodeUrl,
          invoiceNumber: `INV-${Date.now()}`,
          expiryTime,
          transactionId,
        };
        break;

      case "BANK_TRANSFER":
        // For bank transfers, provide bank account details
        paymentData = {
          invoiceNumber: `INV-${Date.now()}`,
          expiryTime,
          transactionId,
        };
        break;

      case "VIRTUAL_ACCOUNT":
        // For virtual accounts, generate a virtual account number
        paymentCode = `8277${Math.floor(10000000000 + Math.random() * 90000000000)}`;
        paymentData = {
          invoiceNumber: `INV-${Date.now()}`,
          expiryTime,
          transactionId,
          paymentCode,
        };
        break;

      case "CREDIT_CARD":
        // For credit cards, provide a redirect URL to a payment page
        redirectUrl = `https://payment.example.com/credit-card?order=${orderId}&amount=${amount}`;
        paymentData = {
          invoiceNumber: `INV-${Date.now()}`,
          expiryTime,
          transactionId,
          redirectUrl,
        };
        break;

      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

    // Update order with payment information
    const { error: updateError } = await supabaseClient
      .from("marketplace_orders")
      .update({
        payment_method: paymentMethod,
        payment_gateway_id: paymentMethod,
        payment_code: paymentCode || null,
        payment_redirect_url: redirectUrl || null,
        transaction_id: transactionId,
        invoice_number: paymentData.invoiceNumber,
        qr_code_url: paymentData.qrCodeUrl || null,
        payment_expiry: expiryTime,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(
        "Error updating order with payment information:",
        updateError,
      );
      throw updateError;
    }

    // Return payment data
    return new Response(
      JSON.stringify({
        success: true,
        ...paymentData,
        order: { id: orderId },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
