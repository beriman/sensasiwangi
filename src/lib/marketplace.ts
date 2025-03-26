import { supabase } from "../../supabase/supabase";
import { MarketplaceProduct } from "@/types/marketplace";

// Get all active products
export async function getProducts(): Promise<MarketplaceProduct[]> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .select(
      `
      *,
      seller:seller_id(full_name, avatar_url)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get products by seller ID
export async function getProductsBySeller(
  sellerId: string,
): Promise<MarketplaceProduct[]> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .select(
      `
      *,
      seller:seller_id(full_name, avatar_url)
    `,
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get a single product by ID
export async function getProduct(
  productId: string,
): Promise<MarketplaceProduct | null> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .select(
      `
      *,
      seller:seller_id(full_name, avatar_url)
    `,
    )
    .eq("id", productId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

// Create a new product
export async function createProduct(
  sellerId: string,
  name: string,
  description: string,
  price: number,
  imageUrl?: string,
  additionalData?: any,
): Promise<MarketplaceProduct> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .insert({
      seller_id: sellerId,
      name,
      description,
      price,
      image_url: imageUrl || null,
      status: "active",
      ...(additionalData || {}),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update a product
export async function updateProduct(
  productId: string,
  updates: Partial<MarketplaceProduct>,
): Promise<MarketplaceProduct> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a product (or mark as inactive)
export async function deleteProduct(productId: string): Promise<void> {
  // Option 1: Actually delete the product
  // const { error } = await supabase
  //   .from("marketplace_products")
  //   .delete()
  //   .eq("id", productId);

  // Option 2: Mark as inactive (soft delete)
  const { error } = await supabase
    .from("marketplace_products")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) throw error;
}
