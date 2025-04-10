import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messageId, senderId, recipientId, conversationId } =
      await req.json();

    if (!messageId || !senderId || !recipientId || !conversationId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get message details
    const { data: message, error: messageError } = await supabase
      .from("private_messages")
      .select("content, created_at")
      .eq("id", messageId)
      .single();

    if (messageError) {
      throw messageError;
    }

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("full_name, username")
      .eq("id", senderId)
      .single();

    if (senderError) {
      throw senderError;
    }

    // Get recipient details and check notification preferences
    const { data: recipient, error: recipientError } = await supabase
      .from("users")
      .select("email, email_forum_replies")
      .eq("id", recipientId)
      .single();

    if (recipientError) {
      throw recipientError;
    }

    // Check if recipient has email notifications enabled
    if (!recipient.email || !recipient.email_forum_replies) {
      return new Response(
        JSON.stringify({
          message: "Recipient has email notifications disabled",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Create a notification in the database
    const { error: notificationError } = await supabase
      .from("forum_notifications")
      .insert({
        user_id: recipientId,
        type: "message",
        content: `${sender.full_name || sender.username || "Seseorang"} mengirim pesan baru kepada Anda`,
        thread_id: null,
        reply_id: null,
        is_read: false,
        created_by: senderId,
      });

    if (notificationError) {
      throw notificationError;
    }

    // Send email notification
    // This is a placeholder - in a real implementation, you would integrate with an email service
    console.log(`Sending email notification to ${recipient.email}`);
    console.log(`From: ${sender.full_name || sender.username}`);
    console.log(`Message: ${message.content.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending message notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
