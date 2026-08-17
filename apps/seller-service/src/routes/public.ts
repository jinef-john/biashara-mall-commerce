import { Router, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '@biashara-mall/prisma';

/** Unauthenticated — the shop profile page reads this. */
export const publicShopsRouter: Router = Router();

const SHOP_SELECT = {
  id: true,
  name: true,
  bio: true,
  logoUrl: true,
  coverUrl: true,
  category: true,
  address: true,
  country: true,
  openingHours: true,
  website: true,
  socialLinks: true,
  createdAt: true,
  _count: { select: { followers: true, products: true } },
} as const;

publicShopsRouter.get('/get-seller/:id', async (req: Request, res: Response) => {
  const shop = await prisma.shops.findUnique({
    where: { id: String(req.params.id) },
    select: {
      ...SHOP_SELECT,
      reviews: {
        select: {
          id: true,
          rating: true,
          review: true,
          createdAt: true,
          user: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!shop) {
    return res.status(404).json({ message: 'Shop not found' });
  }

  // A signed-in visitor gets `isFollowing` so the button renders correctly on load.
  const { userId } = getAuth(req);
  let isFollowing = false;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      isFollowing = Boolean(
        await prisma.follower.findUnique({
          where: { userId_shopId: { userId: user.id, shopId: shop.id } },
        }),
      );
    }
  }

  return res.json({ shop, isFollowing });
});
