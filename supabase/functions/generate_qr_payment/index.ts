import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PaymentGatewayResponse {
  success: boolean;
  data?: {
    qr_string: string;
    qr_code_url: string;
    transaction_id: string;
    expiry_time: string;
  };
  error?: string;
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    // Check if we have the required credentials
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase credentials. Please check your environment variables.",
      );

      return new Response(
        JSON.stringify({
          error:
            "Supabase credentials not found. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your project settings.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 500,
        },
      );
    }

    // Use service key if available, otherwise use anon key
    const apiKey = supabaseServiceKey || supabaseAnonKey;

    const supabaseClient = createClient(supabaseUrl, apiKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Get request body
    const {
      orderId,
      amount,
      buyerId,
      paymentMethod = "QRIS",
    } = await req.json();

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: orderId and amount are required",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        },
      );
    }

    // Generate a unique invoice number
    const timestamp = new Date().getTime();
    const invoiceNumber = `INV-${timestamp}-${orderId.substring(0, 8)}`;

    // Set expiry time to 15 minutes from now
    const expiryTime = new Date(timestamp + 15 * 60 * 1000).toISOString();

    // Generate a unique transaction ID
    const transactionId = `TRX-${timestamp}-${Math.random().toString(36).substring(2, 10)}`;

    // In a real implementation, you would call your payment provider's API here
    // For example, with Xendit, Midtrans, or other Indonesian payment gateways

    // Simulate calling a payment gateway API
    let paymentGatewayResponse: PaymentGatewayResponse;

    try {
      // This is where you would make the actual API call to your payment gateway
      // For example:
      // const response = await fetch('https://api.payment-gateway.com/qris/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PAYMENT_API_KEY}` },
      //   body: JSON.stringify({
      //     external_id: invoiceNumber,
      //     amount: amount,
      //     callback_url: `${supabaseUrl}/functions/v1/process_payment_callback`,
      //     type: paymentMethod
      //   })
      // });
      // paymentGatewayResponse = await response.json();

      // For now, we'll simulate a successful response
      paymentGatewayResponse = {
        success: true,
        data: {
          qr_string: `00020101021226590014ID.LINKAJA.WWW011893600911002734123456304${amount}5802ID5920Sensasi Wangi Indonesia6007Jakarta6105401106304${transactionId}`,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            `00020101021226590014ID.${paymentMethod}.WWW011893600911002734123456304${amount}5802ID5920Sensasi Wangi Indonesia6007Jakarta6105401106304${transactionId}`,
          )}`,
          transaction_id: transactionId,
          expiry_time: expiryTime,
        },
      };
    } catch (apiError) {
      console.error("Error calling payment gateway API:", apiError);

      // Fallback to a simple QR code if the payment gateway API fails
      paymentGatewayResponse = {
        success: true,
        data: {
          qr_string: JSON.stringify({
            invoiceNumber,
            amount,
            buyerId,
            timestamp,
            paymentMethod,
          }),
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            JSON.stringify({
              invoiceNumber,
              amount,
              buyerId,
              timestamp,
              paymentMethod,
            }),
          )}`,
          transaction_id: transactionId,
          expiry_time: expiryTime,
        },
      };
    }

    if (!paymentGatewayResponse.success || !paymentGatewayResponse.data) {
      return new Response(
        JSON.stringify({
          error:
            paymentGatewayResponse.error ||
            "Failed to generate payment QR code",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 500,
        },
      );
    }

    // Update the order with the payment information
    const { data, error } = await supabaseClient
      .from("marketplace_orders")
      .update({
        invoice_number: invoiceNumber,
        qr_code_url: paymentGatewayResponse.data.qr_code_url,
        transaction_id: paymentGatewayResponse.data.transaction_id,
        payment_method: paymentMethod,
        payment_expiry: paymentGatewayResponse.data.expiry_time,
        payment_status: "pending",
      })
      .eq("id", orderId)
      .select();

    if (error) {
      console.error("Error updating order with QR code:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          invoiceNumber,
          qrCodeUrl: paymentGatewayResponse.data.qr_code_url,
          expiryTime: paymentGatewayResponse.data.expiry_time,
          transactionId: paymentGatewayResponse.data.transaction_id,
          order: data[0],
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Unexpected error in generate_qr_payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
