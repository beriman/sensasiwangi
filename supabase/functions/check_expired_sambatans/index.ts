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
      .select("id, product_id, initiator_id, product:product_id(name)")
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
            metadata: { sambatan_id: sambatan.id },
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
