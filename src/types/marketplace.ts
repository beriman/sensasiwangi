export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url: string | null;
  additional_images?: string[];
  status: "active" | "inactive" | "sold";
  moderation_status?: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  seller?: {
    id?: string;
    full_name: string;
    avatar_url: string;
    city?: string;
  };
  is_sambatan?: boolean;
  min_participants?: number;
  max_participants?: number;
  is_wishlisted?: boolean;
  avg_rating?: number;
  review_count?: number;
  weight?: number; // Product weight in grams
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  category?: string;
  stock?: number;
  condition?: "new" | "used";
  shipping_info?: string;
  rating?: number;
}

export interface SambatanParticipant {
  id: string;
  sambatan_id: string;
  participant_id: string;
  quantity: number;
  payment_status: "pending" | "verified" | "cancelled";
  payment_proof: string | null;
  created_at: string;
  updated_at: string;
  participant?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Sambatan {
  id: string;
  initiator_id: string;
  product_id: string;
  target_quantity: number;
  current_quantity: number;
  max_participants: number; // Maximum number of participants allowed
  status: "open" | "closed" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  initiator?: {
    full_name: string;
    avatar_url: string;
  };
  product?: MarketplaceProduct;
  participants?: SambatanParticipant[];
}
