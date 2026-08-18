import { Router, type Request, type Response } from 'express';
import { requireUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';

export const followRouter: Router = Router();

followRouter.post(
  '/follow-shop',
  requireUser,
  async (req: Request, res: Response) => {
    const { shopId } = req.body;
    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required' });
    }

    const shop = await prisma.shops.findUnique({ where: { id: shopId } });
    if (!shop || shop.status === 'banned') {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await prisma.follower.upsert({
      where: { userId_shopId: { userId: req.appUser!.id, shopId } },
      create: { userId: req.appUser!.id, shopId },
      update: {},
    });

    return res.status(201).json({ following: true });
  },
);

followRouter.post(
  '/unfollow-shop',
  requireUser,
  async (req: Request, res: Response) => {
    const { shopId } = req.body;
    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required' });
    }

    await prisma.follower
      .delete({ where: { userId_shopId: { userId: req.appUser!.id, shopId } } })
      .catch(() => null); // already unfollowed — treat as success

    return res.json({ following: false });
  },
);
