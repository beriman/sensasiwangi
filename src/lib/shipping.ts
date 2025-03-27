import { supabase } from "../../supabase/supabase";
import {
  ShippingProvider,
  ShippingRate,
  ShippingTrackingUpdate,
} from "@/types/marketplace";

// Get all active shipping providers
export async function getShippingProviders(): Promise<ShippingProvider[]> {
  const { data, error } = await supabase
    .from("shipping_providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data || [];
}

// Get shipping rates for a specific route
export async function getShippingRates(
  originCity: string,
  destinationCity: string,
): Promise<ShippingRate[]> {
  const { data, error } = await supabase
    .from("shipping_rates")
    .select(
      `
      *,
      provider:provider_id(*)
    `,
    )
    .eq("origin_city", originCity)
    .eq("destination_city", destinationCity)
    .order("price");

  if (error) throw error;
  return data || [];
}

// Calculate shipping cost based on product weight and dimensions
export async function calculateShippingCost(
  productId: string,
  quantity: number,
  originCity: string,
  destinationCity: string,
  providerId?: string,
): Promise<ShippingRate[]> {
  // In a real implementation, this would use the product weight and dimensions
  // to calculate accurate shipping costs. For now, we'll just return available rates.

  let query = supabase
    .from("shipping_rates")
    .select(
      `
      *,
      provider:provider_id(*)
    `,
    )
    .eq("origin_city", originCity)
    .eq("destination_city", destinationCity);

  if (providerId) {
    query = query.eq("provider_id", providerId);
  }

  const { data, error } = await query.order("price");

  if (error) throw error;
  return data || [];
}

// Add a tracking update for an order
export async function addTrackingUpdate(
  orderId: string,
  status: string,
  description?: string,
  location?: string,
): Promise<ShippingTrackingUpdate> {
  const { data, error } = await supabase
    .from("shipping_tracking_updates")
    .insert({
      order_id: orderId,
      status,
      description: description || null,
      location: location || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Also update the order's shipping status
  await supabase
    .from("marketplace_orders")
    .update({
      shipping_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return data;
}

// Get tracking updates for an order
export async function getTrackingUpdates(
  orderId: string,
): Promise<ShippingTrackingUpdate[]> {
  const { data, error } = await supabase
    .from("shipping_tracking_updates")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Update shipping information for an order
export async function updateOrderShipping(
  orderId: string,
  updates: {
    shipping_provider_id?: string;
    shipping_cost?: number;
    shipping_tracking_number?: string;
    shipping_status?: string;
    estimated_delivery_date?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("marketplace_orders")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw error;
}

// Save user shipping address
export async function saveUserShippingAddress(
  userId: string,
  address: string,
  city: string,
  province: string,
  postalCode: string,
  phone: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      shipping_address: address,
      shipping_city: city,
      shipping_province: province,
      shipping_postal_code: postalCode,
      shipping_phone: phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

// Get user shipping address
export async function getUserShippingAddress(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "shipping_address, shipping_city, shipping_province, shipping_postal_code, shipping_phone",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;

  if (!data.shipping_address) return null;

  return {
    address: data.shipping_address,
    city: data.shipping_city,
    province: data.shipping_province,
    postal_code: data.shipping_postal_code,
    phone: data.shipping_phone,
  };
}
