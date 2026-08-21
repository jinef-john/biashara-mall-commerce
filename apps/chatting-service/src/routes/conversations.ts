import { Router, type Request, type Response } from 'express';
import { requireShop, requireUser } from '@biashara-mall/auth';
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

conversationsRouter.post(
  '/create-user-conversationGroup',
  requireUser,
  async (req: Request, res: Response) => {
    const { shopId } = req.body;
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
    if (existing) return res.json({ conversation: existing, isNew: false });

    const conversation = await prisma.conversationGroup.create({
      data: {
        creatorId: userId,
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
  requireUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const groups = await prisma.conversationGroup.findMany({
      where: { participantIds: { has: userId } },
      orderBy: { updatedAt: 'desc' },
    });

    const conversations = await Promise.all(
      groups.map(async (group) => {
        const shopId = group.participantIds.find((id) => id !== userId);
        const [shop, lastMessage, unreadCount] = await Promise.all([
          shopId ? prisma.shops.findUnique({ where: { id: shopId } }) : null,
          lastMessageOf(group.id),
          getUnseenCount(group.id, userId),
        ]);

        return {
          id: group.id,
          updatedAt: group.updatedAt,
          lastMessage,
          unreadCount,
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
        const [user, lastMessage, unreadCount] = await Promise.all([
          userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
          lastMessageOf(group.id),
          getUnseenCount(group.id, shopId),
        ]);

        return {
          id: group.id,
          updatedAt: group.updatedAt,
          lastMessage,
          unreadCount,
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
  requireUser,
  async (req: Request, res: Response) => listMessages(req, res, req.appUser!.id),
);

conversationsRouter.get(
  '/get-seller-messages/:conversationId',
  requireShop,
  async (req: Request, res: Response) => listMessages(req, res, req.shop!.id),
);
