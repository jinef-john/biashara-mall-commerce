export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  ratings: number;
  startingDate?: string | null;
  endingDate?: string | null;
  images: { id: string; fileUrl: string }[];
  shop: {
    id: string;
    name: string;
    logoUrl: string | null;
    category: string | null;
  };
}

export interface ShopSummary {
  id: string;
  name: string;
  bio: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  category: string | null;
  address: string | null;
  country: string | null;
  openingHours: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  createdAt: string;
  _count: { followers: number; products: number };
}

export interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  shortDescription: string;
  detailedDescription: string;
  brand: string | null;
  warranty: string | null;
  cashOnDelivery: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  salePrice: number;
  regularPrice: number;
  stock: number;
  ratings: number;
  startingDate?: string | null;
  endingDate?: string | null;
  images: { id: string; fileUrl: string }[];
  reviews: ProductReviewSummary[];
  shop: ShopSummary;
}

export interface ProductReviewSummary {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

export interface ShopCardData {
  id: string;
  name: string;
  bio: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  category: string | null;
  country: string | null;
  _count: { followers: number; products: number };
}
