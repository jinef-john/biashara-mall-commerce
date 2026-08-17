import { readFileSync } from 'node:fs';
import { prisma } from '@biashara-mall/prisma';

interface AmazonItem {
  asin: string;
  title: string | null;
  brand: string | null;
  price: string | null;
  currency: string | null;
  rating: number | null;
  review_count: number | null;
  main_image_url: string | null;
  images: { thumb: string | null; main: string | null; hi_res: string | null }[];
  feature_bullets: string[];
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || 'product';
  let slug = base;
  let suffix = 1;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function main() {
  const raw = readFileSync(
    new URL('../../datq/amazontest.json', import.meta.url),
    'utf-8',
  );
  const items: AmazonItem[] = JSON.parse(raw);

  const shop = await prisma.shops.findFirst({ where: { name: 'Lovo' } });
  if (!shop) throw new Error('Shop "Lovo" not found — create it in seller-ui first');

  const usable = items.filter((item) => item.title && item.main_image_url && item.price);
  console.log(`${usable.length}/${items.length} sample items have usable data`);

  let created = 0;
  for (const item of usable) {
    const price = Number(item.price);
    // Half the catalogue gets a modest sale price so the storefront's
    // strikethrough-price UI has something to actually show.
    const onSale = created % 2 === 0;
    const regularPrice = Math.round(price * 100) / 100;
    const salePrice = onSale
      ? Math.round(regularPrice * 0.85 * 100) / 100
      : regularPrice;

    const images = [
      item.main_image_url,
      ...item.images.map((i) => i.hi_res).filter((url) => url && url !== item.main_image_url),
    ].filter((url): url is string => Boolean(url));

    const title = item.title!.trim();

    await prisma.product.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        category: 'Books & Stationery',
        subcategory: 'Music & Media',
        shortDescription: item.brand ? `By ${item.brand}.` : 'Imported from a sample catalogue.',
        detailedDescription: `<p>${title}${item.brand ? ` — ${item.brand}` : ''}</p><p>Seeded from sample marketplace data for local development.</p>`,
        brand: item.brand,
        tags: ['music', 'media'],
        stock: 10 + Math.floor(Math.random() * 40),
        salePrice,
        regularPrice,
        ratings: item.rating ?? 5,
        cashOnDelivery: 'yes',
        status: 'active',
        shopId: shop.id,
        images: {
          create: images.map((fileUrl, i) => ({
            fileId: `seed-${item.asin}-${i}`,
            fileUrl,
          })),
        },
      },
    });
    created += 1;
  }

  console.log(`Created ${created} products under "${shop.name}" (${shop.id})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
