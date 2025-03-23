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
}
