import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "URL:",
        supabaseUrl,
        "Key:",
        supabaseServiceKey ? "[exists]" : "[missing]",
      );
      throw new Error(
        "Supabase credentials not found in environment variables",
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get current timestamp
    const now = new Date().toISOString();

    // Find all expired sambatans that are still open
    const { data: expiredSambatans, error: findError } = await supabaseAdmin
      .from("sambatan")
      .select(
        "id, product_id, initiator_id, product:product_id(name, image_url), target_quantity, current_quantity",
      )
      .eq("status", "open")
      .lt("expires_at", now);

    if (findError) {
      throw new Error(`Error finding expired sambatans: ${findError.message}`);
    }

    if (!expiredSambatans || expiredSambatans.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired sambatans found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Update each expired sambatan to cancelled status
    const updatePromises = expiredSambatans.map(async (sambatan) => {
      // Update sambatan status
      const { error: updateError } = await supabaseAdmin
        .from("sambatan")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("id", sambatan.id);

      if (updateError) {
        console.error(
          `Error updating sambatan ${sambatan.id}: ${updateError.message}`,
        );
        return { id: sambatan.id, success: false, error: updateError.message };
      }

      // Send notification to participants
      try {
        // Get all participants
        const { data: participants } = await supabaseAdmin
          .from("sambatan_participants")
          .select("participant_id")
          .eq("sambatan_id", sambatan.id);

        if (participants && participants.length > 0) {
          // Create notifications for all participants
          const notifications = participants.map((participant) => ({
            user_id: participant.participant_id,
            type: "sambatan_expired",
            title: "Sambatan Kedaluwarsa",
            content: `Sambatan untuk ${sambatan.product?.name || "produk"} telah kedaluwarsa dan dibatalkan karena tidak mencapai target peserta dalam waktu yang ditentukan.`,
            metadata: {
              sambatan_id: sambatan.id,
              product_id: sambatan.product_id,
              product_name: sambatan.product?.name,
              product_image: sambatan.product?.image_url,
              target_quantity: sambatan.target_quantity,
              current_quantity: sambatan.current_quantity,
            },
            read: false,
            created_at: now,
          }));

          // Insert notifications
          const { error: notifError } = await supabaseAdmin
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error(
              `Error creating notifications for sambatan ${sambatan.id}: ${notifError.message}`,
            );
          }
        }

        // Send special notification to initiator with more details
        const initiatorNotification = {
          user_id: sambatan.initiator_id,
          type: "sambatan_expired_initiator",
          title: "Sambatan Anda Kedaluwarsa",
          content: `Sambatan yang Anda mulai untuk ${sambatan.product?.name || "produk"} telah kedaluwarsa dan dibatalkan karena tidak mencapai target ${sambatan.target_quantity} peserta dalam waktu yang ditentukan. Hanya ${sambatan.current_quantity} dari ${sambatan.target_quantity} slot yang terisi.`,
          metadata: {
            sambatan_id: sambatan.id,
            product_id: sambatan.product_id,
            product_name: sambatan.product?.name,
            product_image: sambatan.product?.image_url,
            target_quantity: sambatan.target_quantity,
            current_quantity: sambatan.current_quantity,
            is_initiator: true,
          },
          read: false,
          created_at: now,
        };

        const { error: initiatorNotifError } = await supabaseAdmin
          .from("notifications")
          .insert(initiatorNotification);

        if (initiatorNotifError) {
          console.error(
            `Error creating initiator notification for sambatan ${sambatan.id}: ${initiatorNotifError.message}`,
          );
        }

        // If there are participants with pending payments, refund them
        const { data: pendingPayments } = await supabaseAdmin
          .from("sambatan_participants")
          .select("id, participant_id, payment_status, payment_proof")
          .eq("sambatan_id", sambatan.id)
          .eq("payment_status", "pending");

        if (pendingPayments && pendingPayments.length > 0) {
          // Create refund records or update payment status as needed
          const refundUpdates = pendingPayments.map(async (payment) => {
            // If they've uploaded payment proof, mark for refund
            if (payment.payment_proof) {
              // Create a refund record
              const { error: refundError } = await supabaseAdmin
                .from("refunds")
                .insert({
                  user_id: payment.participant_id,
                  sambatan_id: sambatan.id,
                  amount: null, // Admin will need to determine amount
                  status: "pending",
                  reason: "Sambatan expired",
                  created_at: now,
                });

              if (refundError) {
                console.error(
                  `Error creating refund record: ${refundError.message}`,
                );
              }

              // Send refund notification
              const { error: refundNotifError } = await supabaseAdmin
                .from("notifications")
                .insert({
                  user_id: payment.participant_id,
                  type: "refund_initiated",
                  title: "Pengembalian Dana Diproses",
                  content: `Pembayaran Anda untuk Sambatan ${sambatan.product?.name || "produk"} yang kedaluwarsa akan dikembalikan. Tim admin akan menghubungi Anda untuk proses pengembalian dana.`,
                  metadata: {
                    sambatan_id: sambatan.id,
                    product_id: sambatan.product_id,
                    refund_status: "pending",
                  },
                  read: false,
                  created_at: now,
                });

              if (refundNotifError) {
                console.error(
                  `Error creating refund notification: ${refundNotifError.message}`,
                );
              }
            } else {
              // If no payment proof, just cancel their participation
              const { error: cancelError } = await supabaseAdmin
                .from("sambatan_participants")
                .update({
                  payment_status: "cancelled",
                  updated_at: now,
                })
                .eq("id", payment.id);

              if (cancelError) {
                console.error(
                  `Error cancelling participant payment: ${cancelError.message}`,
                );
              }
            }
          });

          await Promise.all(refundUpdates);
        }

        return { id: sambatan.id, success: true };
      } catch (notifError) {
        console.error(
          `Error processing notifications for sambatan ${sambatan.id}: ${notifError.message}`,
        );
        return {
          id: sambatan.id,
          success: true,
          notificationError: notifError.message,
        };
      }
    });

    const results = await Promise.all(updatePromises);

    return new Response(
      JSON.stringify({
        message: `Processed ${expiredSambatans.length} expired sambatans`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing expired sambatans:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
