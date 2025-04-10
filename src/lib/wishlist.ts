import { supabase } from "../supabase/supabase";
import { User } from "@supabase/supabase-js";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

/**
 * Add a product to the user's wishlist
 */
export const addToWishlist = async (productId: string, user: User | null) => {
  if (!user) {
    throw new Error("User must be logged in to add to wishlist");
  }

  const { data, error } = await supabase
    .from("marketplace_wishlists")
    .insert([
      {
        user_id: user.id,
        product_id: productId,
      },
    ])
    .select();

  if (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }

  return data?.[0] as WishlistItem;
};

/**
 * Remove a product from the user's wishlist
 */
export const removeFromWishlist = async (productId: string, user: User | null) => {
  if (!user) {
    throw new Error("User must be logged in to remove from wishlist");
  }

  const { error } = await supabase
    .from("marketplace_wishlists")
    .delete()
    .match({ user_id: user.id, product_id: productId });

  if (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }

  return true;
};

/**
 * Check if a product is in the user's wishlist
 */
export const isInWishlist = async (productId: string, user: User | null) => {
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("marketplace_wishlists")
    .select("id")
    .match({ user_id: user.id, product_id: productId })
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking wishlist:", error);
    return false;
  }

  return !!data;
};

/**
 * Get all products in the user's wishlist
 */
export const getWishlist = async (user: User | null) => {
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("marketplace_wishlists")
    .select(`
      id,
      product_id,
      created_at,
      marketplace_products (
        id,
        name,
        description,
        price,
        image_url,
        status,
        seller_id,
        created_at,
        updated_at
      )
    `)
    .match({ user_id: user.id })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist:", error);
    throw error;
  }

  return data.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    created_at: item.created_at,
    product: item.marketplace_products,
  }));
};

/**
 * Toggle a product in the user's wishlist
 */
export const toggleWishlist = async (productId: string, user: User | null) => {
  if (!user) {
    throw new Error("User must be logged in to manage wishlist");
  }

  const isWishlisted = await isInWishlist(productId, user);

  if (isWishlisted) {
    await removeFromWishlist(productId, user);
    return false;
  } else {
    await addToWishlist(productId, user);
    return true;
  }
};
