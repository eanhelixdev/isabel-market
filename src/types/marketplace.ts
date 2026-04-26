export type UserRole = "user" | "admin";

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "sold"
  | "archived";

export type OrderStatus =
  | "pending"
  | "payment_created"
  | "paid"
  | "cancelled"
  | "failed"
  | "refunded";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  age: number | null;
  role: UserRole;
  onboarding_completed: boolean;
  reputation_score: number;
  created_at: string;
  updated_at: string;
};

export type ProductCard = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  year: number | null;
  price: number;
  currency: string;
  status: ProductStatus;
  category: string | null;
  condition: string | null;
  location: string | null;
  approved_at: string | null;
  created_at: string;
  image_url: string | null;
  likes_count: number;
  seller_name: string | null;
  seller_avatar_url: string | null;
  seller_reputation_score: number;
};

export type ProductDetail = ProductCard & {
  material: string | null;
  dimensions: string | null;
  origin_story: string | null;
  rejection_reason: string | null;
  images: Array<{
    id: string;
    image_url: string;
    sort_order: number;
  }>;
};

export type SellerPublicProfile = Profile & {
  approved_products_count: number;
  sold_products_count: number;
  likes_received_count: number;
};
