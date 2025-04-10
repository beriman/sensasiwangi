import { supabase } from "../../supabase/supabase";

export { supabase };

// Helper functions for common Supabase operations

// Generic fetch function with error handling
export async function fetchData<T>(
  query: Promise<{ data: T | null; error: any }>,
) {
  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  return data;
}

// User profile functions
export async function getUserProfile(userId: string) {
  return fetchData(
    supabase.from("profiles").select("*").eq("id", userId).single(),
  );
}

// Marketplace functions
export async function getProducts(limit = 10, offset = 0, category?: string) {
  let query = supabase
    .from("marketplace_products")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  return fetchData(query);
}

// Sambatan functions
export async function getSambatans(limit = 10, offset = 0, status?: string) {
  let query = supabase
    .from("sambatan")
    .select(
      `
      *,
      product:marketplace_products(*),
      initiator:profiles(*),
      sambatan_participants(count)
    `,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  return fetchData(query);
}

export async function getSambatanById(sambatanId: string) {
  return fetchData(
    supabase
      .from("sambatan")
      .select(
        `
        *,
        product:marketplace_products(*),
        initiator:profiles(*),
        sambatan_participants(*, participant:profiles(*))
      `,
      )
      .eq("id", sambatanId)
      .single(),
  );
}

// Realtime subscriptions
export function subscribeToSambatan(
  sambatanId: string,
  callback: (payload: any) => void,
) {
  return supabase
    .channel(`sambatan:${sambatanId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sambatan",
        filter: `id=eq.${sambatanId}`,
      },
      callback,
    )
    .subscribe();
}

export function subscribeToSambatanParticipants(
  sambatanId: string,
  callback: (payload: any) => void,
) {
  return supabase
    .channel(`sambatan_participants:${sambatanId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sambatan_participants",
        filter: `sambatan_id=eq.${sambatanId}`,
      },
      callback,
    )
    .subscribe();
}
