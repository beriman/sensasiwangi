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
    const { threadId, replyId, replierName, threadTitle } = await req.json();

    if (!threadId || !replyId || !replierName || !threadTitle) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users following this thread with email notifications enabled
    const { data: followers, error: followersError } = await supabase
      .from("forum_follows")
      .select("user_id")
      .eq("thread_id", threadId)
      .eq("email_notifications", true);

    if (followersError) throw followersError;

    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No followers with email notifications" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Get user emails
    const userIds = followers.map((f) => f.user_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);

    if (usersError) throw usersError;

    // Get thread URL
    const threadUrl = `${Deno.env.get("PUBLIC_URL") || ""}/forum/thread/${threadId}`;

    // Send emails to all followers
    const emailPromises = users.map(async (user) => {
      if (!user.email) return null;

      const { error: emailError } = await supabase.auth.admin.createMessage({
        template: "thread-reply",
        type: "email",
        subject: `New reply in thread: ${threadTitle}`,
        email: user.email,
        data: {
          thread_title: threadTitle,
          replier_name: replierName,
          thread_url: threadUrl,
          user_id: user.id,
        },
      });

      if (emailError) {
        console.error(`Error sending email to ${user.email}:`, emailError);
        return { email: user.email, success: false, error: emailError.message };
      }

      return { email: user.email, success: true };
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        results: results.filter(Boolean),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing thread notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
