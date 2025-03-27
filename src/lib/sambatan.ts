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
  expirationDays: number = 7, // Default expiration of 7 days
): Promise<Sambatan> {
  await ensureSambatanTablesExist();

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

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
): Promise<void> {
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

  if (sambatan.current_quantity + quantity > sambatan.target_quantity) {
    throw new Error(
      `Slot tidak cukup. Tersisa ${sambatan.target_quantity - sambatan.current_quantity} slot dari ${sambatan.target_quantity} total slot.`,
    );
  }

  // Check if user is already a participant
  const { data: existingParticipant, error: participantError } = await supabase
    .from("sambatan_participants")
    .select("*")
    .eq("sambatan_id", sambatanId)
    .eq("participant_id", participantId);

  if (participantError) {
    console.error("Error checking existing participant:", participantError);
    throw new Error("Gagal memeriksa partisipasi Anda. Silakan coba lagi.");
  }

  if (existingParticipant && existingParticipant.length > 0) {
    throw new Error("Anda sudah bergabung dengan Sambatan ini");
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
}

// Update payment status
export async function updatePaymentStatus(
  sambatanId: string,
  participantId: string,
  paymentStatus: "pending" | "verified" | "cancelled",
  paymentProof?: string,
  paymentMethod?: string,
): Promise<void> {
  await ensureSambatanTablesExist();

  const updateData: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (paymentProof) {
    updateData.payment_proof = paymentProof;
  }

  if (paymentMethod) {
    updateData.payment_method = paymentMethod;
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

  // If payment is verified and all participants have verified payments, update sambatan status
  if (paymentStatus === "verified") {
    await checkAndUpdateSambatanStatus(sambatanId);
  }
}

// Verify payment as admin
export async function verifyPayment(
  sambatanId: string,
  participantId: string,
  isVerified: boolean,
): Promise<void> {
  await ensureSambatanTablesExist();

  const status = isVerified ? "verified" : "cancelled";

  await updatePaymentStatus(sambatanId, participantId, status);

  // Get product name for notification
  const { data: sambatan } = await supabase
    .from("sambatan")
    .select("product:product_id(name)")
    .eq("id", sambatanId)
    .single();

  // Send payment verification notification
  if (isVerified) {
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
            eventType: "payment_verified",
            participantId,
            productName: sambatan?.product?.name,
          }),
        },
      );
    } catch (error) {
      console.error("Error sending payment verification notification:", error);
    }

    // Check if all participants have verified payments
    await checkAndUpdateSambatanStatus(sambatanId);
  }
}

// Check if all participants have verified payments and update sambatan status
async function checkAndUpdateSambatanStatus(sambatanId: string): Promise<void> {
  const { data: sambatan, error: sambatanError } = await supabase
    .from("sambatan")
    .select("*, product:product_id(name)")
    .eq("id", sambatanId)
    .single();

  if (sambatanError) {
    console.error("Error fetching sambatan:", sambatanError);
    return;
  }

  // Only proceed if sambatan is closed or open (with all slots filled)
  if (sambatan.status !== "closed" && sambatan.status !== "open") {
    return;
  }

  // Get all participants
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

  if (allVerified) {
    // Update sambatan status to completed
    const { error: updateError } = await supabase
      .from("sambatan")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sambatanId);

    if (updateError) {
      console.error("Error updating sambatan status:", updateError);
    } else {
      console.log(
        `Sambatan ${sambatanId} marked as completed - all payments verified`,
      );

      // Send sambatan completed notification
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
              productName: sambatan.product?.name,
            }),
          },
        );
      } catch (error) {
        console.error("Error sending sambatan completed notification:", error);
      }
    }
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
