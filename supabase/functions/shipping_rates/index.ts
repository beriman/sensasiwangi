import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShippingRateRequest {
  origin: string;
  destination: string;
  weight: number;
  courier?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Hard-code the Supabase URL and key for edge functions
    // These will be automatically injected by Supabase during deployment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Log available environment variables for debugging
    console.log(
      "Environment variables available:",
      Object.keys(Deno.env.toObject()),
    );

    if (!supabaseUrl || !supabaseKey) {
      // Return a more detailed error response instead of throwing
      return new Response(
        JSON.stringify({
          error: "Supabase credentials not found in environment variables",
          availableVars: Object.keys(Deno.env.toObject()),
          message:
            "Edge function cannot connect to Supabase. Please check your environment configuration.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Create Supabase client with proper authorization header handling
    // Get the Authorization header if it exists
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get request body
    const { origin, destination, weight, courier } =
      (await req.json()) as ShippingRateRequest;

    if (!origin || !destination || !weight) {
      return new Response(
        JSON.stringify({
          error: "Origin, destination, and weight are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // In a real implementation, this would call an external shipping API
    // For demo purposes, we'll generate some mock shipping rates
    const mockCouriers = [
      { code: "jne", name: "JNE" },
      { code: "jnt", name: "J&T Express" },
      { code: "sicepat", name: "SiCepat" },
      { code: "pos", name: "Pos Indonesia" },
      { code: "anteraja", name: "AnterAja" },
    ];

    // Filter by courier if specified
    const availableCouriers = courier
      ? mockCouriers.filter((c) => c.code === courier)
      : mockCouriers;

    // Generate mock shipping rates
    const basePrice = 10000; // Base price in IDR
    const weightFactor = weight / 1000; // Convert to kg
    const distanceFactor = Math.random() * 2 + 1; // Random factor between 1-3

    const rates = availableCouriers.flatMap((courier) => {
      // Each courier has multiple service types
      const services = [
        { type: "REG", name: "Reguler", multiplier: 1, days: 3 },
        { type: "YES", name: "Yakin Esok Sampai", multiplier: 1.5, days: 1 },
        {
          type: "OKE",
          name: "Ongkos Kirim Ekonomis",
          multiplier: 0.8,
          days: 5,
        },
      ];

      return services.map((service) => ({
        courier_code: courier.code,
        courier_name: courier.name,
        service_code: service.type,
        service_name: service.name,
        price:
          Math.round(
            (basePrice * weightFactor * distanceFactor * service.multiplier) /
              100,
          ) * 100, // Round to nearest 100
        etd: `${service.days}-${service.days + 1} hari`,
        weight: weight,
      }));
    });

    return new Response(
      JSON.stringify({
        origin,
        destination,
        weight,
        rates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
