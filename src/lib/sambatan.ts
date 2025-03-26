import { supabase } from "../../supabase/supabase";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";

// Check if tables exist and create them if they don't
async function ensureSambatanTablesExist() {
  try {
    // Check if the sambatan table exists by trying to select from it
    const { error } = await supabase.from("sambatan").select("id").limit(1);

    // If there's an error, the table might not exist, so call the edge function
    if (error && error.code === "42P01") {
      // Get the session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.warn(
          "No access token available for authenticated request to create tables",
        );
        // Continue without authentication - the edge function will handle this case
      }

      // Call the edge function to create the tables
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_sambatan_tables`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create sambatan tables:", errorText);

        // If we get a 500 error with credentials not found, we'll try to continue anyway
        // The app might still work if the tables already exist
        if (
          response.status === 500 &&
          errorText.includes("credentials not found")
        ) {
          console.warn(
            "Continuing despite credential error - tables may already exist",
          );
        }
      }
    }
  } catch (error) {
    console.error("Error checking sambatan tables:", error);
  }
}

// Get all active sambatan
export async function getSambatans(): Promise<Sambatan[]> {
  await ensureSambatanTablesExist();

  const { data, error } = await supabase
    .from("sambatan")
    .select(
      `
      *,
      initiator:initiator_id(id, full_name, avatar_url),
      product:product_id(*,
        seller:seller_id(id, full_name, avatar_url)
      )
    `,
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sambatans:", error);
    return [];
  }
  return data || [];
}

// Get sambatan by ID
export async function getSambatan(
  sambatanId: string,
): Promise<Sambatan | null> {
  await ensureSambatanTablesExist();

  const { data, error } = await supabase
    .from("sambatan")
    .select(
      `
      *,
      initiator:initiator_id(id, full_name, avatar_url),
      product:product_id(*,
        seller:seller_id(id, full_name, avatar_url)
      )
    `,
    )
    .eq("id", sambatanId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching sambatan:", error);
    return null;
  }
  return data;
}

// Get sambatan participants
export async function getSambatanParticipants(
  sambatanId: string,
): Promise<SambatanParticipant[]> {
  await ensureSambatanTablesExist();

  const { data, error } = await supabase
    .from("sambatan_participants")
    .select(
      `
      *,
      participant:participant_id(id, full_name, avatar_url)
    `,
    )
    .eq("sambatan_id", sambatanId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching sambatan participants:", error);
    return [];
  }
  return data || [];
}

// Create a new sambatan
export async function createSambatan(
  initiatorId: string,
  productId: string,
  targetQuantity: number,
): Promise<Sambatan> {
  await ensureSambatanTablesExist();

  // First, update the product to mark it as a sambatan product if not already
  await supabase
    .from("marketplace_products")
    .update({ is_sambatan: true })
    .eq("id", productId);

  const { data, error } = await supabase
    .from("sambatan")
    .insert({
      initiator_id: initiatorId,
      product_id: productId,
      target_quantity: targetQuantity,
      current_quantity: 1, // Initiator counts as first participant
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating sambatan:", error);
    throw error;
  }

  // Add initiator as first participant
  const { error: participantError } = await supabase
    .from("sambatan_participants")
    .insert({
      sambatan_id: data.id,
      participant_id: initiatorId,
      quantity: 1,
      payment_status: "pending",
    });

  if (participantError) {
    console.error("Error adding initiator as participant:", participantError);
    throw participantError;
  }

  return data;
}

// Join a sambatan
export async function joinSambatan(
  sambatanId: string,
  participantId: string,
  quantity: number,
): Promise<void> {
  await ensureSambatanTablesExist();

  // First check if the sambatan is still open and has capacity
  const { data: sambatan, error: sambatanError } = await supabase
    .from("sambatan")
    .select("*")
    .eq("id", sambatanId)
    .eq("status", "open")
    .single();

  if (sambatanError) {
    console.error("Error fetching sambatan:", sambatanError);
    throw sambatanError;
  }

  if (!sambatan) {
    throw new Error("Sambatan not found or already closed");
  }

  if (sambatan.current_quantity + quantity > sambatan.target_quantity) {
    throw new Error("Not enough slots available in this Sambatan");
  }

  // Check if user is already a participant
  const { data: existingParticipant, error: participantError } = await supabase
    .from("sambatan_participants")
    .select("*")
    .eq("sambatan_id", sambatanId)
    .eq("participant_id", participantId);

  if (participantError) {
    console.error("Error checking existing participant:", participantError);
    throw participantError;
  }

  if (existingParticipant && existingParticipant.length > 0) {
    throw new Error("You are already a participant in this Sambatan");
  }

  // Add participant
  const { error: joinError } = await supabase
    .from("sambatan_participants")
    .insert({
      sambatan_id: sambatanId,
      participant_id: participantId,
      quantity,
      payment_status: "pending",
    });

  if (joinError) {
    console.error("Error joining sambatan:", joinError);
    throw joinError;
  }

  // Update current quantity
  const { error: updateError } = await supabase
    .from("sambatan")
    .update({
      current_quantity: sambatan.current_quantity + quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sambatanId);

  if (updateError) {
    console.error("Error updating sambatan quantity:", updateError);
    throw updateError;
  }

  // If sambatan is now full, close it
  if (sambatan.current_quantity + quantity >= sambatan.target_quantity) {
    const { error: closeError } = await supabase
      .from("sambatan")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sambatanId);

    if (closeError) {
      console.error("Error closing sambatan:", closeError);
      throw closeError;
    }
  }
}

// Update payment status
export async function updatePaymentStatus(
  sambatanId: string,
  participantId: string,
  paymentStatus: "pending" | "verified" | "cancelled",
  paymentProof?: string,
): Promise<void> {
  await ensureSambatanTablesExist();

  const updateData: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (paymentProof) {
    updateData.payment_proof = paymentProof;
  }

  const { error } = await supabase
    .from("sambatan_participants")
    .update(updateData)
    .eq("sambatan_id", sambatanId)
    .eq("participant_id", participantId);

  if (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
}

// Get sambatan by Product ID
export async function getSambatanByProduct(
  productId: string,
): Promise<Sambatan | null> {
  await ensureSambatanTablesExist();

  const { data, error } = await supabase
    .from("sambatan")
    .select(
      `
      *,
      initiator:initiator_id(id, full_name, avatar_url),
      product:product_id(*,
        seller:seller_id(id, full_name, avatar_url)
      )
    `,
    )
    .eq("product_id", productId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching sambatan by product:", error);
    return null;
  }
  return data;
}
