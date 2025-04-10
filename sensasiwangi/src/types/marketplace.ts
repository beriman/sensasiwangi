export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  additional_images?: string[];
  status: "active" | "inactive" | "sold";
  moderation_status?: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  seller?: {
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
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface ShippingProvider {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  id: string;
  provider_id: string;
  provider?: ShippingProvider;
  origin_city: string;
  destination_city: string;
  service_type: string;
  service_code?: string;
  price: number;
  estimated_days: number;
  weight?: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingTrackingUpdate {
  id: string;
  order_id: string;
  status: string;
  description: string | null;
  location: string | null;
  timestamp: string;
  created_at: string;
}

export interface ShippingTrackingDetail {
  tracking_number: string;
  provider_code: string;
  status: string;
  estimated_delivery: string;
  last_update: string;
  updates: Array<{
    timestamp: string;
    status: string;
    description: string;
    location: string;
  }>;
}

export interface ShippingAddress {
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
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
