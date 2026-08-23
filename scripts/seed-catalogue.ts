import { prisma } from '@biashara-mall/prisma';
import { readCatalogue, type CsvProduct } from './lib/catalogue-csv';

const CSV_PATH = new URL('../../datq/amazon_products_cleaned.csv', import.meta.url).pathname;
const TARGET_PRODUCTS = 5000;
const SHOP_COUNT = 40;
const EVENT_RATE = 0.05;
const WRITE_CHUNK = 40;

const SHOP_PREFIXES = [
  'Biashara', 'Sokoni', 'Mkeka', 'Kazi', 'Nuru', 'Tembo', 'Baraka', 'Jua',
  'Safari', 'Zawadi', 'Rafiki', 'Imara', 'Chui', 'Anga', 'Bahari', 'Kito',
  'Mvua', 'Nia', 'Pamoja', 'Tumaini',
];
const SHOP_SUFFIXES = ['Traders', 'Supply Co.', 'Market', 'Outlet', 'Depot', 'Hub', 'House', 'Collective'];

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Nigeria', 'Ghana'];
const CITIES = ['Nairobi', 'Mombasa', 'Kampala', 'Dar es Salaam', 'Kigali', 'Lagos', 'Accra'];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function pick<T>(list: T[], i: number): T {
  return list[i % list.length];
}

/** Even spread across categories, so no aisle is empty and none dominates. */
function sampleEvenly(items: CsvProduct[], target: number): CsvProduct[] {
  const byCategory = new Map<string, CsvProduct[]>();
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category)!.push(item);
  }

  const perCategory = Math.ceil(target / byCategory.size);
  const out: CsvProduct[] = [];
  for (const group of byCategory.values()) {
    out.push(...group.slice(0, perCategory));
  }
  return out.slice(0, target);
}

function descriptionFor(item: CsvProduct) {
  return {
    shortDescription: `${item.subcategory} from the ${item.category} range.`,
    detailedDescription:
      `<p>${item.name}</p>` +
      `<p>Category: ${item.category} &rsaquo; ${item.subcategory}.</p>` +
      `<p>Rated ${item.rating.toFixed(1)} by ${item.totalRatings.toLocaleString()} buyers.</p>`,
  };
}

async function main() {
  console.log('Reading catalogue…');
  const all = readCatalogue(CSV_PATH);
  const sample = sampleEvenly(all, TARGET_PRODUCTS);
  const categories = [...new Set(sample.map((p) => p.category))].sort();

  const subcategories: Record<string, string[]> = {};
  for (const category of categories) {
    subcategories[category] = [
      ...new Set(sample.filter((p) => p.category === category).map((p) => p.subcategory)),
    ].sort();
  }

  console.log(`${all.length} usable rows, seeding ${sample.length} across ${categories.length} categories`);

  // --- shops -------------------------------------------------------------
  // Each shop gets a primary category so the catalogue reads like real
  // specialist stores rather than 40 identical general stores; that category
  // affinity is also what makes recommendations meaningful.
  const shopIdsByCategory = new Map<string, string[]>();
  let shopsCreated = 0;

  for (let i = 0; i < SHOP_COUNT; i++) {
    const category = pick(categories, i);
    const name = `${pick(SHOP_PREFIXES, i)} ${pick(SHOP_SUFFIXES, Math.floor(i / SHOP_PREFIXES.length) + i)}`;
    const clerkOrgId = `seed_org_${i}`;

    const shop = await prisma.shops.upsert({
      where: { clerkOrgId },
      create: {
        clerkOrgId,
        ownerId: `seed_owner_${i}`,
        name,
        bio: `Specialists in ${category.toLowerCase()}. Seeded catalogue for local development.`,
        address: `${10 + i} Market Street`,
        country: pick(COUNTRIES, i),
        openingHours: 'Mon-Sat, 8am - 6pm',
        category,
        status: 'active',
      },
      update: { category },
    });

    if (!shopIdsByCategory.has(category)) shopIdsByCategory.set(category, []);
    shopIdsByCategory.get(category)!.push(shop.id);
    shopsCreated++;
  }
  console.log(`${shopsCreated} seed shops ready`);

  const allShopIds = [...shopIdsByCategory.values()].flat();

  // --- products ----------------------------------------------------------
  const takenSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug),
  );

  const rows = sample.map((item, i) => {
    let slug = slugify(item.name) || 'product';
    if (takenSlugs.has(slug)) {
      let n = 2;
      while (takenSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    takenSlugs.add(slug);

    const regularPrice = Math.round(item.price * 100) / 100;
    const onSale = i % 3 === 0;
    const salePrice = onSale ? Math.round(regularPrice * 0.82 * 100) / 100 : regularPrice;

    const isEvent = i % Math.round(1 / EVENT_RATE) === 0;
    const startingDate = isEvent ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null;
    const endingDate = isEvent
      ? new Date(Date.now() + (3 + (i % 10)) * 24 * 60 * 60 * 1000)
      : null;

    const shopPool = shopIdsByCategory.get(item.category) ?? allShopIds;

    return {
      ...descriptionFor(item),
      title: item.name,
      slug,
      category: item.category,
      subcategory: item.subcategory,
      tags: item.subcategory.toLowerCase().split(/\s+/).slice(0, 3),
      stock: 5 + ((i * 7) % 60),
      salePrice,
      regularPrice,
      ratings: Math.min(5, item.rating),
      // A proxy, so Top Shops and "best selling" sorts rank on something real.
      totalSales: Math.floor(item.totalRatings / 10),
      cashOnDelivery: 'yes',
      status: 'active' as const,
      startingDate,
      endingDate,
      shopId: pick(shopPool, i),
      imageUrl: item.imageUrl,
    };
  });

  let created = 0;
  for (let i = 0; i < rows.length; i += WRITE_CHUNK) {
    const chunk = rows.slice(i, i + WRITE_CHUNK);
    await Promise.all(
      chunk.map(({ imageUrl, ...data }, j) =>
        prisma.product.create({
          data: {
            ...data,
            images: { create: [{ fileId: `seed-catalogue-${i + j}`, fileUrl: imageUrl }] },
          },
        }),
      ),
    );
    created += chunk.length;
    if (created % 500 === 0 || created === rows.length) {
      console.log(`  ${created}/${rows.length} products`);
    }
  }

  // --- site config -------------------------------------------------------
  const existing = await prisma.siteConfig.findFirst();
  if (existing) {
    await prisma.siteConfig.update({
      where: { id: existing.id },
      data: { categories, subcategories },
    });
  } else {
    await prisma.siteConfig.create({ data: { categories, subcategories } });
  }

  const events = rows.filter((r) => r.startingDate).length;
  console.log(
    `Done: ${created} products (${events} events) across ${shopsCreated} shops, ` +
      `${categories.length} categories in SiteConfig`,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
