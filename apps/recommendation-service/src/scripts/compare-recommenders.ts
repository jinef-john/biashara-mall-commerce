import 'dotenv/config';
import { prisma } from '@biashara-mall/prisma';
import { trainAndRecommend } from '../services/recommendation.service';
import { recommendSimilarItems } from '../services/item-similarity.service';

const SAMPLE_USERS = 8;

async function affinitiesOf(userId: string) {
  const analytics = await prisma.userAnalytics.findUnique({ where: { userId } });
  const ids = analytics!.actions.map((a) => a.productId!).filter(Boolean);
  const history = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { category: true },
  });
  const counts = new Map<string, number>();
  for (const p of history) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return new Set([...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c));
}

async function hitRate(ids: string[], affinities: Set<string>) {
  if (ids.length === 0) return 0;
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { category: true },
  });
  return products.filter((p) => affinities.has(p.category)).length / ids.length;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { clerkId: { startsWith: 'seed_user_' } },
    take: SAMPLE_USERS,
    orderBy: { createdAt: 'asc' },
  });

  const categories = await prisma.product.groupBy({ by: ['category'], _count: true });
  const total = categories.reduce((s, c) => s + c._count, 0);

  let mfSum = 0, ccSum = 0, baseSum = 0, mfMs = 0, ccMs = 0;

  for (const user of users) {
    const affinities = await affinitiesOf(user.id);
    const baseline =
      categories.filter((c) => affinities.has(c.category)).reduce((s, c) => s + c._count, 0) / total;
    baseSum += baseline;

    let t = Date.now();
    const cc = await recommendSimilarItems(user.id);
    ccMs += Date.now() - t;

    t = Date.now();
    const mf = await trainAndRecommend(user.id);
    mfMs += Date.now() - t;

    const ccHit = await hitRate(cc, affinities);
    const mfHit = await hitRate(mf, affinities);
    ccSum += ccHit;
    mfSum += mfHit;

    console.log(
      `${user.clerkId.padEnd(14)} baseline ${(baseline * 100).toFixed(0).padStart(3)}%  ` +
      `item-item ${(ccHit * 100).toFixed(0).padStart(3)}%  matrix-fact ${(mfHit * 100).toFixed(0).padStart(3)}%`,
    );
  }

  const n = users.length;
  console.log('\n--- averages over', n, 'users ---');
  console.log(`random baseline : ${((baseSum / n) * 100).toFixed(1)}%`);
  console.log(`item-item CF    : ${((ccSum / n) * 100).toFixed(1)}%   (${(ccMs / n).toFixed(0)}ms/user)`);
  console.log(`matrix fact.    : ${((mfSum / n) * 100).toFixed(1)}%   (${(mfMs / n / 1000).toFixed(1)}s/user)`);
}
main().finally(() => process.exit());
