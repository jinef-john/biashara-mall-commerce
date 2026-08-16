import { prisma } from '@biashara-mall/prisma';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Stationery',
  'Groceries',
];

const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Electronics: ['Mobiles', 'Laptops', 'Cameras', 'Audio', 'Accessories'],
  'Fashion & Apparel': ['Men', 'Women', 'Kids', 'Footwear'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  'Beauty & Personal Care': ['Skincare', 'Haircare', 'Makeup', 'Fragrance'],
  'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Team Sports'],
  'Toys & Games': ['Action Figures', 'Board Games', 'Educational'],
  'Books & Stationery': ['Fiction', 'Non-fiction', 'Office Supplies'],
  Groceries: ['Snacks', 'Beverages', 'Pantry Staples'],
};

export async function initializeConfig() {
  const existing = await prisma.siteConfig.findFirst();
  if (existing) return;

  await prisma.siteConfig.create({
    data: {
      categories: DEFAULT_CATEGORIES,
      subcategories: DEFAULT_SUBCATEGORIES,
    },
  });
  console.log('SiteConfig seeded with default categories');
}
