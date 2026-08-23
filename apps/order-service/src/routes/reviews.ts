import { Router, type Request, type Response } from 'express';
import { requireActiveUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import { averageRating, parseRating, parseReviewText } from '../lib/reviews';

export const reviewsRouter: Router = Router();

/** A review is only credible if the buyer received the thing. Anything short of
 * delivered — including a cancelled or still-shipping order — cannot review. */
async function deliveredOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId)
    return { order: null, error: 'Order not found' };
  if (order.status !== 'delivered') {
    return {
      order: null,
      error: 'You can review once this order is delivered',
    };
  }
  return { order, error: null };
}

async function refreshProductRating(productId: string) {
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    select: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { ratings: averageRating(reviews.map((r) => r.rating)) },
  });
}

reviewsRouter.get(
  '/reviews/order/:orderId',
  requireActiveUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.orderId) },
      include: { shop: { select: { id: true, name: true } } },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIds = order.items.map((item) => item.productId);
    const [productReviews, shopReview] = await Promise.all([
      prisma.productReview.findMany({
        where: { userId, productId: { in: productIds } },
      }),
      prisma.shopReview.findUnique({
        where: { userId_shopId: { userId, shopId: order.shopId } },
      }),
    ]);

    const byProduct = new Map(
      productReviews.map((review) => [review.productId, review]),
    );

    return res.json({
      canReview: order.status === 'delivered',
      shop: order.shop,
      items: order.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        review: byProduct.get(item.productId) ?? null,
      })),
      shopReview,
    });
  },
);

reviewsRouter.post(
  '/reviews/product',
  requireActiveUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const { orderId, productId, rating, review } = req.body;

    const parsedRating = parseRating(rating);
    if (parsedRating === null) {
      return res.status(400).json({ message: 'Rating must be 1 to 5 stars' });
    }

    const { order, error } = await deliveredOrder(
      String(orderId ?? ''),
      userId,
    );
    if (!order) return res.status(400).json({ message: error });

    // The order is the proof of purchase, so the product has to be in it.
    if (!order.items.some((item) => item.productId === String(productId))) {
      return res
        .status(400)
        .json({ message: 'That product is not in this order' });
    }

    const saved = await prisma.productReview.upsert({
      where: { userId_productId: { userId, productId: String(productId) } },
      create: {
        userId,
        productId: String(productId),
        rating: parsedRating,
        review: parseReviewText(review),
      },
      update: { rating: parsedRating, review: parseReviewText(review) },
    });

    await refreshProductRating(String(productId));

    return res.json({ review: saved });
  },
);

reviewsRouter.post(
  '/reviews/shop',
  requireActiveUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const { orderId, rating, review } = req.body;

    const parsedRating = parseRating(rating);
    if (parsedRating === null) {
      return res.status(400).json({ message: 'Rating must be 1 to 5 stars' });
    }

    const { order, error } = await deliveredOrder(
      String(orderId ?? ''),
      userId,
    );
    if (!order) return res.status(400).json({ message: error });

    const saved = await prisma.shopReview.upsert({
      where: { userId_shopId: { userId, shopId: order.shopId } },
      create: {
        userId,
        shopId: order.shopId,
        rating: parsedRating,
        review: parseReviewText(review),
      },
      update: { rating: parsedRating, review: parseReviewText(review) },
    });

    return res.json({ review: saved });
  },
);
