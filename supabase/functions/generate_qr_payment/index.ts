import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { orderId, amount, buyerId } = await req.json();

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

    // In a real implementation, you would call your payment provider's API here
    // For this example, we'll simulate generating a QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      JSON.stringify({
        invoiceNumber,
        amount,
        buyerId,
        timestamp,
      }),
    )}`;

    // Update the order with the invoice number and QR code URL
    const { data, error } = await supabaseClient
      .from("marketplace_orders")
      .update({
        invoice_number: invoiceNumber,
        qr_code_url: qrCodeUrl,
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
          qrCodeUrl,
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
