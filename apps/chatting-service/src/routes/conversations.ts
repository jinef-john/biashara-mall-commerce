import { Router, type Request, type Response } from 'express';
import { requireShop, requireActiveUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import { getUnseenCount, redis } from '@biashara-mall/redis';

export const conversationsRouter: Router = Router();

const MESSAGES_PER_PAGE = 10;

async function lastMessageOf(conversationId: string) {
  return prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
  });
}

async function productContext(productId: string | null) {
  if (!productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      slug: true,
      salePrice: true,
      images: { take: 1, select: { fileUrl: true } },
    },
  });
  if (!product) return null;
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    salePrice: product.salePrice,
    imageUrl: product.images[0]?.fileUrl ?? null,
  };
}

conversationsRouter.post(
  '/create-user-conversationGroup',
  requireActiveUser,
  async (req: Request, res: Response) => {
    const { shopId, productId } = req.body;
    if (!shopId) return res.status(400).json({ message: 'shopId is required' });

    const shop = await prisma.shops.findUnique({ where: { id: shopId } });
    if (!shop || shop.status === 'banned') {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const userId = req.appUser!.id;

    // Reused, so messaging the same shop again lands in the existing thread.
    const existing = await prisma.conversationGroup.findFirst({
      where: { participantIds: { hasEvery: [userId, shopId] } },
    });

    if (existing) {
      // Re-point the context when the buyer opens chat from a different
      // product, so the seller sees what's being asked about now.
      const conversation =
        productId && productId !== existing.productId
          ? await prisma.conversationGroup.update({
              where: { id: existing.id },
              data: { productId },
            })
          : existing;
      return res.json({ conversation, isNew: false });
    }

    const conversation = await prisma.conversationGroup.create({
      data: {
        creatorId: userId,
        productId: productId ?? null,
        participantIds: [userId, shopId],
        participants: {
          create: [{ userId }, { shopId }],
        },
      },
    });

    return res.status(201).json({ conversation, isNew: true });
  },
);

conversationsRouter.get(
  '/get-user-conversations',
  requireActiveUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const groups = await prisma.conversationGroup.findMany({
      where: { participantIds: { has: userId } },
      orderBy: { updatedAt: 'desc' },
    });

    const conversations = await Promise.all(
      groups.map(async (group) => {
        const shopId = group.participantIds.find((id) => id !== userId);
        const [shop, lastMessage, unreadCount, product] = await Promise.all([
          shopId ? prisma.shops.findUnique({ where: { id: shopId } }) : null,
          lastMessageOf(group.id),
          getUnseenCount(group.id, userId),
          productContext(group.productId),
        ]);

        return {
          id: group.id,
          updatedAt: group.updatedAt,
          lastMessage,
          unreadCount,
          product,
          shop: shop && {
            id: shop.id,
            name: shop.name,
            logoUrl: shop.logoUrl,
            isOnline: (await redis.exists(`online:shop:${shop.id}`)) === 1,
          },
        };
      }),
    );

    return res.json({ conversations });
  },
);

conversationsRouter.get(
  '/get-seller-conversations',
  requireShop,
  async (req: Request, res: Response) => {
    const shopId = req.shop!.id;
    const groups = await prisma.conversationGroup.findMany({
      where: { participantIds: { has: shopId } },
      orderBy: { updatedAt: 'desc' },
    });

    const conversations = await Promise.all(
      groups.map(async (group) => {
        const userId = group.participantIds.find((id) => id !== shopId);
        const [user, lastMessage, unreadCount, product] = await Promise.all([
          userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
          lastMessageOf(group.id),
          getUnseenCount(group.id, shopId),
          productContext(group.productId),
        ]);

        return {
          id: group.id,
          updatedAt: group.updatedAt,
          lastMessage,
          unreadCount,
          product,
          user: user && {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            isOnline: (await redis.exists(`online:user:${user.id}`)) === 1,
          },
        };
      }),
    );

    return res.json({ conversations });
  },
);

async function listMessages(req: Request, res: Response, viewerId: string) {
  const conversationId = String(req.params.conversationId);
  const page = Math.max(1, Number(req.query.page) || 1);

  const group = await prisma.conversationGroup.findUnique({
    where: { id: conversationId },
  });
  if (!group || !group.participantIds.includes(viewerId)) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * MESSAGES_PER_PAGE,
      take: MESSAGES_PER_PAGE,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return res.json({
    messages,
    pagination: {
      total,
      page,
      hasMore: page * MESSAGES_PER_PAGE < total,
    },
  });
}

conversationsRouter.get(
  '/get-messages/:conversationId',
  requireActiveUser,
  async (req: Request, res: Response) => listMessages(req, res, req.appUser!.id),
);

conversationsRouter.get(
  '/get-seller-messages/:conversationId',
  requireShop,
  async (req: Request, res: Response) => listMessages(req, res, req.shop!.id),
);
