import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Add CORS headers
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

      // Log available environment variables for debugging (without exposing sensitive values)
      console.log("Available environment variables:", {
        SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
        VITE_SUPABASE_URL: !!Deno.env.get("VITE_SUPABASE_URL"),
        SUPABASE_ANON_KEY: !!Deno.env.get("SUPABASE_ANON_KEY"),
        VITE_SUPABASE_ANON_KEY: !!Deno.env.get("VITE_SUPABASE_ANON_KEY"),
        SUPABASE_SERVICE_KEY: !!Deno.env.get("SUPABASE_SERVICE_KEY"),
      });

      // Use project ID to construct URL if available
      const projectId = Deno.env.get("SUPABASE_PROJECT_ID");
      if (projectId && !supabaseUrl) {
        supabaseUrl = `https://${projectId}.supabase.co`;
        console.log(`Constructed URL from project ID: ${supabaseUrl}`);
      }

      // If still missing credentials after attempts to recover
      if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(
          JSON.stringify({
            error:
              "Supabase credentials not found. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your project settings.",
            projectIdAvailable: !!projectId,
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
    }

    // Use anon key if service key is not available
    const apiKey = supabaseServiceKey || supabaseAnonKey;

    const supabaseClient = createClient(supabaseUrl, apiKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Create the tables if they don't exist
    const { error: createSambatanError } = await supabaseClient.rpc(
      "create_sambatan_tables",
    );

    if (createSambatanError) {
      console.error("Error creating sambatan tables:", createSambatanError);
      return new Response(
        JSON.stringify({ error: createSambatanError.message }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 500,
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error in create_sambatan_tables:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
