export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: "active" | "inactive" | "sold";
  created_at: string;
  updated_at: string;
  seller?: {
    full_name: string;
    avatar_url: string;
  };
  is_sambatan?: boolean;
  min_participants?: number;
  max_participants?: number;
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
  initiator?: {
    full_name: string;
    avatar_url: string;
  };
  product?: MarketplaceProduct;
  participants?: SambatanParticipant[];
}
