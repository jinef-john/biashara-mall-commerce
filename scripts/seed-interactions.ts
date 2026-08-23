import { prisma } from '@biashara-mall/prisma';

const USER_COUNT = 200;
const ACTIONS_PER_USER = 100;
const AFFINITY_CATEGORIES = 3;
// Real catalogues are power-law: a minority of products take most of the traffic.
const POPULARITY_SKEW = 3;
// Taste clusters within each category. Collaborative filtering learns
// item-to-item structure, so the data has to contain some: drawing uniformly
// within a category means two shoppers who both like Jewelry touch different
// jewellery at random, and there is nothing to recover. Clusters give the
// "people who liked this also liked that" shape that real catalogues have.
const CLUSTERS_PER_CATEGORY = 5;
// Share of each user's history that comes from outside their affinities, so
// the model sees genuine cross-category signal instead of perfect clusters.
const NOISE_RATE = 0.2;

// Roughly funnel-shaped: plenty of views, fewer carts, fewer purchases.
const ACTION_WEIGHTS: [string, number][] = [
  ['product_view', 60],
  ['add_to_wishlist', 15],
  ['add_to_cart', 15],
  ['purchase', 10],
];

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Nigeria', 'Ghana'];
const CITIES = ['Nairobi', 'Mombasa', 'Kampala', 'Dar es Salaam', 'Kigali', 'Lagos'];
const DEVICES = ['Desktop', 'Mobile', 'Tablet'];

// Deterministic PRNG: reruns produce the same catalogue affinities, so a model
// trained twice on a fresh seed is comparable.
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function weightedAction(random: () => number): string {
  const total = ACTION_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [action, weight] of ACTION_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return action;
  }
  return 'product_view';
}

async function main() {
  const random = makeRandom(20260822);

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { id: true, category: true, shopId: true },
  });
  if (products.length === 0) {
    throw new Error('No products found: run `bun run seed:catalogue` first');
  }

  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    if (!byCategory.has(product.category)) byCategory.set(product.category, []);
    byCategory.get(product.category)!.push(product);
  }
  const categories = [...byCategory.keys()];
  console.log(`${products.length} products across ${categories.length} categories`);

  let usersCreated = 0;
  let actionsWritten = 0;

  for (let i = 0; i < USER_COUNT; i++) {
    const clerkId = `seed_user_${i}`;
    const user = await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email: `seed.buyer.${i}@biashara.local`,
        name: `Seed Buyer ${i}`,
        status: 'active',
      },
      update: {},
    });
    usersCreated++;

    const affinities: { category: string; cluster: number }[] = [];
    while (affinities.length < AFFINITY_CATEGORIES) {
      const category = categories[Math.floor(random() * categories.length)];
      if (affinities.some((a) => a.category === category)) continue;
      affinities.push({
        category,
        cluster: Math.floor(random() * CLUSTERS_PER_CATEGORY),
      });
    }

    const actions = [];
    for (let n = 0; n < ACTIONS_PER_USER; n++) {
      const fromAffinity = random() > NOISE_RATE;
      const affinity = affinities[Math.floor(random() * affinities.length)];
      const category = fromAffinity
        ? affinity.category
        : categories[Math.floor(random() * categories.length)];

      const categoryPool = byCategory.get(category)!;
      const clusterPool = fromAffinity
        ? categoryPool.filter(
            (_, index) => index % CLUSTERS_PER_CATEGORY === affinity.cluster,
          )
        : categoryPool;
      const pool = clusterPool.length > 0 ? clusterPool : categoryPool;
      const product = pool[Math.floor(pool.length * random() ** POPULARITY_SKEW)];

      actions.push({
        productId: product.id,
        shopId: product.shopId,
        action: weightedAction(random),
        // Spread over the last 60 days so recency-aware logic has a gradient.
        timestamp: new Date(Date.now() - Math.floor(random() * 60 * 24 * 60 * 60 * 1000)),
      });
    }
    actions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    actionsWritten += actions.length;

    await prisma.userAnalytics.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        country: COUNTRIES[Math.floor(random() * COUNTRIES.length)],
        city: CITIES[Math.floor(random() * CITIES.length)],
        device: DEVICES[Math.floor(random() * DEVICES.length)],
        lastVisited: actions[actions.length - 1].timestamp,
        actions,
      },
      update: { actions, lastVisited: actions[actions.length - 1].timestamp },
    });

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${USER_COUNT} users`);
  }

  console.log(`Done: ${usersCreated} seed users, ${actionsWritten} actions`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
