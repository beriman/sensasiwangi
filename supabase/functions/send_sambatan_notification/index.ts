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
    const { sambatanId, eventType, participantId, productName } =
      await req.json();

    if (!sambatanId || !eventType) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client with service role key for admin access
    // Get the project ID from environment variables
    const projectId = Deno.env.get("SUPABASE_PROJECT_ID");

    // Use hardcoded URLs based on project ID if environment variables aren't available
    let supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    if (!supabaseUrl && projectId) {
      supabaseUrl = `https://${projectId}.supabase.co`;
    }

    // Try to get the service key or anon key from environment variables
    let supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    // If we still don't have credentials, throw a more detailed error
    if (!supabaseUrl || !supabaseKey) {
      console.error("Environment variables available:", {
        SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
        VITE_SUPABASE_URL: Boolean(Deno.env.get("VITE_SUPABASE_URL")),
        SUPABASE_SERVICE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_KEY")),
        SUPABASE_ANON_KEY: Boolean(Deno.env.get("SUPABASE_ANON_KEY")),
        VITE_SUPABASE_ANON_KEY: Boolean(Deno.env.get("VITE_SUPABASE_ANON_KEY")),
        SUPABASE_PROJECT_ID: Boolean(Deno.env.get("SUPABASE_PROJECT_ID")),
      });
      throw new Error(
        "Supabase credentials not found. Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are set.",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get sambatan details
    const { data: sambatan, error: sambatanError } = await supabase
      .from("sambatan")
      .select(
        "*, initiator:initiator_id(id, full_name, email), product:product_id(*, seller:seller_id(id, full_name, email))",
      )
      .eq("id", sambatanId)
      .single();

    if (sambatanError) throw sambatanError;
    if (!sambatan) throw new Error("Sambatan not found");

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from("sambatan_participants")
      .select("*, participant:participant_id(id, full_name, email)")
      .eq("sambatan_id", sambatanId);

    if (participantsError) throw participantsError;

    // Get participant details if provided
    let participant = null;
    if (participantId) {
      const { data: participantData, error: participantError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", participantId)
        .single();

      if (participantError) throw participantError;
      participant = participantData;
    }

    // Prepare email data based on event type
    let emailSubject = "";
    let emailTemplate = "";
    let emailRecipients = [];
    let emailData = {};

    const sambatanUrl = `${Deno.env.get("PUBLIC_URL") || ""}/marketplace/sambatan/${sambatanId}`;
    const productTitle = productName || sambatan.product.name;

    switch (eventType) {
      case "new_participant":
        if (!participant)
          throw new Error("Participant ID required for new_participant event");

        emailSubject = `Peserta baru bergabung dengan Sambatan: ${productTitle}`;
        emailTemplate = "sambatan-new-participant";
        emailRecipients = [
          { id: sambatan.initiator.id, email: sambatan.initiator.email },
        ];
        emailData = {
          sambatan_title: productTitle,
          participant_name: participant.full_name,
          sambatan_url: sambatanUrl,
          user_id: sambatan.initiator.id,
        };
        break;

      case "quota_reached":
        emailSubject = `Sambatan telah mencapai kuota: ${productTitle}`;
        emailTemplate = "sambatan-quota-reached";
        emailRecipients = participants.map((p) => ({
          id: p.participant.id,
          email: p.participant.email,
        }));
        emailData = {
          sambatan_title: productTitle,
          sambatan_url: sambatanUrl,
        };
        break;

      case "payment_verified":
        if (!participant)
          throw new Error("Participant ID required for payment_verified event");

        emailSubject = `Pembayaran Sambatan telah diverifikasi: ${productTitle}`;
        emailTemplate = "sambatan-payment-verified";
        emailRecipients = [{ id: participantId, email: participant.email }];
        emailData = {
          sambatan_title: productTitle,
          sambatan_url: sambatanUrl,
          user_id: participantId,
        };
        break;

      case "sambatan_completed":
        emailSubject = `Sambatan telah selesai: ${productTitle}`;
        emailTemplate = "sambatan-completed";
        emailRecipients = participants.map((p) => ({
          id: p.participant.id,
          email: p.participant.email,
        }));
        emailRecipients.push({
          id: sambatan.product.seller.id,
          email: sambatan.product.seller.email,
        });
        emailData = {
          sambatan_title: productTitle,
          sambatan_url: sambatanUrl,
        };
        break;

      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }

    // Send emails to all recipients
    const emailPromises = emailRecipients.map(async (recipient) => {
      if (!recipient.email) return null;

      try {
        const { error: emailError } = await supabase.auth.admin.createMessage({
          template: emailTemplate,
          type: "email",
          subject: emailSubject,
          email: recipient.email,
          data: {
            ...emailData,
            user_id: recipient.id,
          },
        });

        if (emailError) {
          console.error(
            `Error sending email to ${recipient.email}:`,
            emailError,
          );
          return {
            email: recipient.email,
            success: false,
            error: emailError.message,
          };
        }

        return { email: recipient.email, success: true };
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        return { email: recipient.email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        message: "Sambatan notifications processed",
        results: results.filter(Boolean),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing sambatan notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
