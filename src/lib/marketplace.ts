import { supabase } from "../../supabase/supabase";
import { MarketplaceProduct } from "@/types/marketplace";

// Get all active products with filtering options
export async function getProducts(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | "popularity";
  limit?: number;
  offset?: number;
}): Promise<MarketplaceProduct[]> {
  let query = supabase
    .from("marketplace_products")
    .select(
      `
      *,
      seller:seller_id(full_name, avatar_url, city)
    `,
    )
    .eq("status", "active");

  // Apply filters if provided
  if (filters) {
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          // This requires a join or a view that includes average ratings
          query = query.order("avg_rating", {
            ascending: false,
            nullsFirst: false,
          });
          break;
        case "popularity":
          // This would ideally use a view or function that calculates popularity
          query = query.order("review_count", {
            ascending: false,
            nullsFirst: false,
          });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

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
      status: "inactive", // Start as inactive until approved
      moderation_status: "pending", // Require moderation
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

// Wishlist functions

// Add a product to wishlist
export async function addToWishlist(productId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .insert({ product_id: productId })
    .select();

  if (error) {
    // If it's a duplicate, we can ignore it
    if (error.code !== "23505") throw error;
  }
}

// Remove a product from wishlist
export async function removeFromWishlist(productId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("product_id", productId);

  if (error) throw error;
}

// Check if a product is in the user's wishlist
export async function isProductWishlisted(productId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Get all products in a user's wishlist
export async function getWishlistedProducts(
  userId?: string,
): Promise<MarketplaceProduct[]> {
  if (!userId) {
    // Get current user if no userId provided
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return []; // Return empty array if no user

  const { data, error } = await supabase
    .from("wishlists")
    .select(
      `
      product_id,
      product:product_id(*, seller:seller_id(full_name, avatar_url))
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Transform the data to match the MarketplaceProduct interface
  return (data || []).map((item) => ({
    ...item.product,
    is_wishlisted: true,
  }));
}

// Review functions

// Get reviews for a product
export async function getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from("marketplace_reviews")
    .select(
      `
      *,
      user:user_id(full_name, avatar_url)
    `,
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get average rating for a product
export async function getProductRating(productId: string) {
  const { data, error } = await supabase
    .rpc("get_product_rating", { product_id: productId })
    .single();

  if (error) {
    console.error("Error getting product rating:", error);
    return { avg_rating: 0, review_count: 0 };
  }

  return {
    avg_rating: data?.avg_rating || 0,
    review_count: data?.review_count || 0,
  };
}

// Check if user has reviewed a product
export async function hasUserReviewedProduct(productId: string) {
  const { data, error } = await supabase
    .from("marketplace_reviews")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Submit a review for a product
export async function submitProductReview(
  productId: string,
  rating: number,
  reviewText?: string,
) {
  const { data, error } = await supabase
    .from("marketplace_reviews")
    .upsert(
      {
        product_id: productId,
        rating,
        review_text: reviewText || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id,user_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a review
export async function deleteProductReview(reviewId: string) {
  const { error } = await supabase
    .from("marketplace_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw error;
}
