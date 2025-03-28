// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/runtime/manual/integrations/bundlers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  orderId: string;
  status: string;
  recipientId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get request body
    const { orderId, status, recipientId } = (await req.json()) as RequestBody;

    if (!orderId || !status || !recipientId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("marketplace_orders")
      .select("id, invoice_number, buyer_id, seller_id, total_price, status")
      .eq("id", orderId)
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: "Error fetching order", details: orderError }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Determine notification type and content based on status
    let notificationType = "";
    let notificationContent = {};

    switch (status) {
      case "new_order":
        notificationType = "new_order";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          total_price: order.total_price,
          message: "Anda memiliki pesanan baru",
        };
        break;
      case "processing":
        notificationType = "order_status_change";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          status: "processing",
          message: "Pesanan Anda sedang diproses",
        };
        break;
      case "shipped":
        notificationType = "order_status_change";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          status: "shipped",
          message: "Pesanan Anda telah dikirim",
        };
        break;
      case "delivered":
        notificationType = "order_status_change";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          status: "delivered",
          message: "Pesanan Anda telah diterima",
        };
        break;
      case "cancelled":
        notificationType = "order_status_change";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          status: "cancelled",
          message: "Pesanan Anda telah dibatalkan",
        };
        break;
      case "payment_verified":
        notificationType = "payment_verified";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          message: "Pembayaran Anda telah diverifikasi",
        };
        break;
      default:
        notificationType = "order_update";
        notificationContent = {
          order_id: order.id,
          invoice_number: order.invoice_number,
          status: status,
          message: "Pesanan Anda telah diperbarui",
        };
    }

    // Insert notification
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: recipientId,
        type: notificationType,
        content: notificationContent,
        reference_id: order.id,
      })
      .select()
      .single();

    if (notificationError) {
      return new Response(
        JSON.stringify({
          error: "Error creating notification",
          details: notificationError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    return new Response(JSON.stringify({ success: true, notification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
