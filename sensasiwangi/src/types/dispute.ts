export interface MarketplaceDispute {
  id: string;
  transaction_id: string;
  initiator_id: string;
  reason: string;
  status:
    | "pending"
    | "under_review"
    | "resolved_buyer"
    | "resolved_seller"
    | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  transaction?: {
    id: string;
    product_name: string;
    amount: number;
    seller: { full_name: string; email: string };
    buyer: { full_name: string; email: string };
  };
  initiator?: {
    full_name: string;
    email: string;
  };
  messages?: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_from_admin: boolean;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface MarketplaceRefund {
  id: string;
  dispute_id: string | null;
  transaction_id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "rejected";
  refund_reason: string;
  admin_notes: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  admin?: {
    full_name: string;
  };
  transaction?: {
    product_name: string;
    buyer: { full_name: string; email: string };
  };
}
