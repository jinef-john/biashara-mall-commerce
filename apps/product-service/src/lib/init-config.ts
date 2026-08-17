import { prisma } from '@biashara-mall/prisma';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUBCATEGORIES,
} from '@biashara-mall/config';

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
