import { Router, type Request, type Response } from 'express';
import { requireUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import {
  MIN_ACTIONS,
  RETRAIN_AFTER_MS,
  trainAndRecommend,
} from '../services/recommendation.service';

export const recommendationsRouter: Router = Router();

const PRODUCT_FIELDS = {
  id: true,
  title: true,
  slug: true,
  salePrice: true,
  regularPrice: true,
  stock: true,
  ratings: true,
  startingDate: true,
  endingDate: true,
  images: { take: 1, select: { id: true, fileUrl: true } },
  shop: { select: { id: true, name: true, logoUrl: true, category: true } },
} as const;

function latestProducts(take: number) {
  return prisma.product.findMany({
    where: { isDeleted: false, status: 'active' },
    orderBy: { createdAt: 'desc' },
    take,
    select: PRODUCT_FIELDS,
  });
}

// Training takes ~50s over the full interaction set, so it never runs on the
// request path: the caller gets the stale cache (or latest products) now, and
// the next request picks up the fresh ranking. Single-flight per user, since
// two concurrent misses would otherwise each build their own model.
const inFlight = new Set<string>();

function retrainInBackground(userId: string) {
  if (inFlight.has(userId)) return;
  inFlight.add(userId);

  void trainAndRecommend(userId)
    .then(async (ids) => {
      if (ids.length === 0) return;
      await prisma.userAnalytics.update({
        where: { userId },
        data: { recommendations: ids, lastTrained: new Date() },
      });
    })
    .catch((err) =>
      console.error(`[recommendation] training failed for ${userId}:`, (err as Error).message),
    )
    .finally(() => inFlight.delete(userId));
}

recommendationsRouter.get(
  '/get-recommendation-products',
  requireUser,
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.appUser!.id;
      const analytics = await prisma.userAnalytics.findUnique({ where: { userId } });

      // Cold start: no history to learn from, so show what's new instead of
      // an empty shelf.
      if (!analytics || analytics.actions.length < MIN_ACTIONS) {
        return res.json({
          products: await latestProducts(10),
          source: 'latest',
        });
      }

      const fresh =
        analytics.lastTrained &&
        Date.now() - analytics.lastTrained.getTime() < RETRAIN_AFTER_MS;

      if (!fresh) retrainInBackground(userId);

      const ids = analytics.recommendations;
      if (ids.length === 0) {
        return res.json({ products: await latestProducts(10), source: 'latest' });
      }

      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isDeleted: false, status: 'active' },
        select: PRODUCT_FIELDS,
      });

      // findMany does not preserve `in` order, and the ranking is the point.
      const byId = new Map(products.map((p) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

      return res.json({
        products: ordered,
        source: fresh ? 'cache' : 'stale',
      });
    } catch (err) {
      next(err);
    }
  },
);
