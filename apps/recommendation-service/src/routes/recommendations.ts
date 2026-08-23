import { Router, type Request, type Response } from 'express';
import { requireActiveUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import {
  MIN_ACTIONS,
  recommendSimilarItems,
} from '../services/item-similarity.service';

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

recommendationsRouter.get(
  '/get-recommendation-products',
  requireActiveUser,
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.appUser!.id;
      const analytics = await prisma.userAnalytics.findUnique({
        where: { userId },
      });

      // Cold start: no history to learn from, so show what's new instead of
      // an empty shelf.
      if (!analytics || analytics.actions.length < MIN_ACTIONS) {
        return res.json({
          products: await latestProducts(10),
          source: 'latest',
        });
      }

      // Scoring is a single pass over a cached interaction index — tens of
      // milliseconds — so it runs inline and stays current instead of serving
      // whatever a periodic job last wrote.
      const ids = await recommendSimilarItems(userId);
      if (ids.length === 0) {
        return res.json({
          products: await latestProducts(10),
          source: 'latest',
        });
      }

      void prisma.userAnalytics
        .update({
          where: { userId },
          data: { recommendations: ids, lastTrained: new Date() },
        })
        .catch(() => undefined);

      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isDeleted: false, status: 'active' },
        select: PRODUCT_FIELDS,
      });

      // findMany does not preserve `in` order, and the ranking is the point.
      const byId = new Map(products.map((p) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

      return res.json({ products: ordered, source: 'item-item' });
    } catch (err) {
      next(err);
    }
  },
);
