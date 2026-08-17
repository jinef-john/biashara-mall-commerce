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

/** One-way progression — shared by order-service (enforces it) and both UIs
 * (render it as a delivery progress bar / "advance to next" control). */
export const ORDER_STATUS_STEPS = [
  'ordered',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatusStep = (typeof ORDER_STATUS_STEPS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusStep, string> = {
  ordered: 'Ordered',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

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
  'Books & Stationery': ['Fiction', 'Non-fiction', 'Office Supplies', 'Music & Media'],
  Groceries: ['Snacks', 'Beverages', 'Pantry Staples'],
};

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_DISCOUNT_CODES_PER_SHOP = 8;

/** Soft-deleted products are purged this long after deletion. */
export const PRODUCT_PURGE_DELAY_MS = 24 * 60 * 60 * 1000;

/** Swatches offered by the product form's color picker and the storefront's color filter. */
export const DEFAULT_COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#ec4899',
  '#06b6d4',
];

/** Sizes offered by the product form's size picker and the storefront's size filter. */
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Markets shops can trade from — drives the storefront's shop-country filter. */
export const COUNTRIES = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Ethiopia',
  'Somalia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'United Kingdom',
  'United States',
];
