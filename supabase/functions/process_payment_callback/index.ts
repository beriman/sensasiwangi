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

    // Get callback data from payment provider
    const { invoice_number, status, amount, payment_method, timestamp } =
      await req.json();

    if (!invoice_number || !status) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required parameters: invoice_number and status are required",
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

    // Find the order with this invoice number
    const { data: orderData, error: orderError } = await supabaseClient
      .from("marketplace_orders")
      .select("*")
      .eq("invoice_number", invoice_number)
      .single();

    if (orderError) {
      console.error("Error finding order with invoice number:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      });
    }

    if (!orderData) {
      return new Response(
        JSON.stringify({
          error: "Order not found with the provided invoice number",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 404,
        },
      );
    }

    // Update the order status based on the payment status
    let orderStatus = "pending";
    if (
      status === "paid" ||
      status === "completed" ||
      status === "settlement"
    ) {
      orderStatus = "paid";
    } else if (
      status === "failed" ||
      status === "expired" ||
      status === "canceled"
    ) {
      orderStatus = "failed";
    }

    // Update the order status
    const { data: updateData, error: updateError } = await supabaseClient
      .from("marketplace_orders")
      .update({
        status: orderStatus,
        payment_method: payment_method || "QRIS",
      })
      .eq("id", orderData.id)
      .select();

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      });
    }

    // If this is a sambatan order, check if we need to update the sambatan status
    if (orderData.sambatan_id) {
      // Get the sambatan details
      const { data: sambatanData, error: sambatanError } = await supabaseClient
        .from("sambatan")
        .select("*")
        .eq("id", orderData.sambatan_id)
        .single();

      if (!sambatanError && sambatanData) {
        // Update the participant's payment status
        await supabaseClient
          .from("sambatan_participants")
          .update({
            payment_status: orderStatus === "paid" ? "verified" : "cancelled",
          })
          .eq("sambatan_id", orderData.sambatan_id)
          .eq("participant_id", orderData.buyer_id);

        // Check if all participants have paid
        const { data: participants, error: participantsError } =
          await supabaseClient
            .from("sambatan_participants")
            .select("payment_status")
            .eq("sambatan_id", orderData.sambatan_id);

        if (!participantsError && participants) {
          const allPaid = participants.every(
            (p) => p.payment_status === "verified",
          );
          if (allPaid) {
            // Update sambatan status to completed
            await supabaseClient
              .from("sambatan")
              .update({
                status: "completed",
              })
              .eq("id", orderData.sambatan_id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: updateData[0],
          status: orderStatus,
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
    console.error("Unexpected error in process_payment_callback:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
