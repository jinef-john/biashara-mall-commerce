/** Platform-wide constants. Single source of truth across services and UIs. */

export const CURRENCY = 'USD';

/** Platform commission in basis points. 1000 = 10%. */
export const PLATFORM_FEE_BPS = 1000;

export function platformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_BPS) / 10000;
}

export function sellerEarning(amount: number): number {
  return Math.round((amount - platformFee(amount)) * 100) / 100;
}

/** Seeded into SiteConfig on first boot; the DB copy is authoritative after that. */
export const DEFAULT_CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Stationery',
  'Groceries',
];

export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Electronics: ['Mobiles', 'Laptops', 'Cameras', 'Audio', 'Accessories'],
  'Fashion & Apparel': ['Men', 'Women', 'Kids', 'Footwear'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  'Beauty & Personal Care': ['Skincare', 'Haircare', 'Makeup', 'Fragrance'],
  'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Team Sports'],
  'Toys & Games': ['Action Figures', 'Board Games', 'Educational'],
  'Books & Stationery': ['Fiction', 'Non-fiction', 'Office Supplies'],
  Groceries: ['Snacks', 'Beverages', 'Pantry Staples'],
};

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_DISCOUNT_CODES_PER_SHOP = 8;

/** Soft-deleted products are purged this long after deletion. */
export const PRODUCT_PURGE_DELAY_MS = 24 * 60 * 60 * 1000;
