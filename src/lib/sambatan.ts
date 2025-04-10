import { supabase } from "../lib/supabase";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";

// Ensure sambatan tables exist
async function ensureSambatanTablesExist() {
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from("sambatan")
      .select("id")
      .limit(1);

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
        console.error("Failed to create sambatan tables:", await response.text());
      }
    }
  } catch (error) {
    console.error("Error ensuring sambatan tables exist:", error);
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
      participant:participant_id(full_name, avatar_url)
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
  maxParticipants?: number, // New parameter for max participants
  expirationDays: number = 7, // Default expiration of 7 days
): Promise<Sambatan> {
  await ensureSambatanTablesExist();

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  // If maxParticipants is not provided, default to targetQuantity
  const finalMaxParticipants = maxParticipants || targetQuantity;

  // Validate maxParticipants
  if (finalMaxParticipants < targetQuantity) {
    throw new Error("Maksimum peserta tidak boleh kurang dari target kuantitas");
  }

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
      max_participants: finalMaxParticipants, // Add max_participants field
      status: "open",
      expires_at: expiresAt.toISOString(),
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
): Promise<SambatanParticipant> {
  await ensureSambatanTablesExist();

  if (quantity <= 0) {
    throw new Error("Jumlah item harus lebih dari 0");
  }

  // First check if the sambatan is still open and has capacity
  const { data: sambatan, error: sambatanError } = await supabase
    .from("sambatan")
    .select("*, product:product_id(name)")
    .eq("id", sambatanId)
    .eq("status", "open")
    .single();

  if (sambatanError) {
    console.error("Error fetching sambatan:", sambatanError);
    throw new Error("Gagal memuat data Sambatan. Silakan coba lagi.");
  }

  if (!sambatan) {
    throw new Error("Sambatan tidak ditemukan atau sudah ditutup");
  }

  // Check if the sambatan has expired
  if (sambatan.expires_at && new Date(sambatan.expires_at) < new Date()) {
    throw new Error("Sambatan ini telah kedaluwarsa");
  }

  // Check if the sambatan has reached its target quantity
  if (sambatan.current_quantity >= sambatan.target_quantity) {
    throw new Error("Sambatan ini sudah mencapai target kuantitas");
  }

  // Check if the sambatan has reached its max participants
  const { data: participants, error: participantsError } = await supabase
    .from("sambatan_participants")
    .select("id")
    .eq("sambatan_id", sambatanId);

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    throw new Error("Gagal memuat data peserta. Silakan coba lagi.");
  }

  // Check if max participants limit has been reached
  if (sambatan.max_participants && participants.length >= sambatan.max_participants) {
    throw new Error("Sambatan ini sudah mencapai batas maksimum peserta");
  }

  // Check if the user is already a participant
  const { data: existingParticipant, error: existingError } = await supabase
    .from("sambatan_participants")
    .select("*")
    .eq("sambatan_id", sambatanId)
    .eq("participant_id", participantId)
    .single();

  if (existingParticipant) {
    throw new Error("Anda sudah bergabung dengan Sambatan ini");
  }

  // Add participant
  const { data: newParticipant, error: joinError } = await supabase
    .from("sambatan_participants")
    .insert({
      sambatan_id: sambatanId,
      participant_id: participantId,
      quantity,
      payment_status: "pending",
    })
    .select("*, participant:participant_id(full_name, avatar_url)")
    .single();

  if (joinError) {
    console.error("Error joining sambatan:", joinError);
    throw new Error("Gagal bergabung dengan Sambatan. Silakan coba lagi.");
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
    throw new Error(
      "Gagal memperbarui jumlah peserta Sambatan. Silakan coba lagi.",
    );
  }

  // Send notification via edge function
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send_sambatan_notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sambatanId,
          eventType: "new_participant",
          participantId,
          productName: sambatan.product?.name,
        }),
      },
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't throw here as the join was successful
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
      // We don't throw here as the join was successful, just log the error
    } else {
      // Send quota reached notification
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send_sambatan_notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sambatanId,
              eventType: "quota_reached",
              productName: sambatan.product?.name,
            }),
          },
        );
      } catch (error) {
        console.error("Error sending quota reached notification:", error);
      }
    }
  }

  return newParticipant;
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

// Update payment status
export async function updatePaymentStatus(
  sambatanId: string,
  participantId: string,
  status: "pending" | "verified" | "cancelled",
  paymentProof?: string,
): Promise<void> {
  await ensureSambatanTablesExist();

  const updateData: any = {
    payment_status: status,
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
    throw new Error("Gagal memperbarui status pembayaran. Silakan coba lagi.");
  }

  // If status is verified, check if all participants are verified
  if (status === "verified") {
    await checkAllPaymentsVerified(sambatanId);
  }
}

// Check if all payments are verified and complete the sambatan if so
async function checkAllPaymentsVerified(sambatanId: string): Promise<void> {
  const { data: sambatan, error: sambatanError } = await supabase
    .from("sambatan")
    .select("*")
    .eq("id", sambatanId)
    .single();

  if (sambatanError) {
    console.error("Error fetching sambatan:", sambatanError);
    return;
  }

  const { data: participants, error: participantsError } = await supabase
    .from("sambatan_participants")
    .select("*")
    .eq("sambatan_id", sambatanId);

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    return;
  }

  // Check if all participants have verified payments
  const allVerified = participants.every(
    (p) => p.payment_status === "verified",
  );

  // If sambatan is open but all slots are filled, close it first
  if (
    sambatan.status === "open" &&
    sambatan.current_quantity >= sambatan.target_quantity
  ) {
    const { error: closeError } = await supabase
      .from("sambatan")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sambatanId);

    if (closeError) {
      console.error("Error closing sambatan:", closeError);
      return;
    }
  }

  // If all payments are verified and sambatan is closed, complete it
  if (allVerified && sambatan.status === "closed") {
    const { error: completeError } = await supabase
      .from("sambatan")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sambatanId);

    if (completeError) {
      console.error("Error completing sambatan:", completeError);
      return;
    }

    // Send completion notification
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send_sambatan_notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sambatanId,
            eventType: "sambatan_completed",
          }),
        },
      );
    } catch (error) {
      console.error("Error sending completion notification:", error);
    }
  }
}
