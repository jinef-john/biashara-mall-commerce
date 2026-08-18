import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma, type OrderStatus } from '@biashara-mall/prisma';
import { requireAdmin, requireShop, requireUser } from '@biashara-mall/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '@biashara-mall/error-handler';
import { ORDER_STATUS_STEPS } from '@biashara-mall/config';

export const ordersRouter: Router = Router();

ordersRouter.get('/get-seller-orders', requireShop, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { shopId: req.shop!.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/get-admin-orders', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          shop: { select: { name: true, logoUrl: true } },
        },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

    res.json({
      orders,
      pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/get-user-orders', requireUser, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.appUser!.id },
      orderBy: { createdAt: 'desc' },
      include: { shop: { select: { name: true, logoUrl: true } } },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// Reached from both seller-ui (via get-seller-orders) and user-ui (via
// get-user-orders), so authorization checks buyer-ownership OR seller-owns-shop
// rather than requiring one specific role.
ordersRouter.get('/get-order-details/:id', requireUser, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
    if (!order) throw new NotFoundError('Order not found');

    const { orgId } = getAuth(req);
    const shop = orgId ? await prisma.shops.findUnique({ where: { clerkOrgId: orgId } }) : null;

    const isBuyer = order.userId === req.appUser!.id;
    const isSeller = shop?.id === order.shopId;
    if (!isBuyer && !isSeller) throw new ForbiddenError('Not your order');

    const productIds = order.items.map((i) => i.productId);
    const [products, buyer, orderShop, discountCode] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, slug: true, images: { take: 1 } },
      }),
      prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } }),
      prisma.shops.findUnique({ where: { id: order.shopId }, select: { name: true, logoUrl: true } }),
      order.couponCode
        ? prisma.discountCodes.findUnique({ where: { discountCode: order.couponCode } })
        : null,
    ]);
    const productMap = new Map(products.map((p) => [p.id, p]));

    res.json({
      order: {
        ...order,
        buyer,
        shop: orderShop,
        items: order.items.map((item) => ({
          ...item,
          product: productMap.get(item.productId) ?? null,
        })),
      },
      discountCode,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.put('/update-status/:orderId', requireShop, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.orderId) } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.shopId !== req.shop!.id) throw new ForbiddenError('Not your order');

    const { status } = req.body as { status?: string };
    const currentIndex = ORDER_STATUS_STEPS.indexOf(order.status);
    const requestedIndex = ORDER_STATUS_STEPS.indexOf(status as OrderStatus);
    const nextStep = ORDER_STATUS_STEPS[currentIndex + 1];

    if (requestedIndex === -1) throw new ValidationError('Invalid status');
    if (!nextStep || requestedIndex !== currentIndex + 1) {
      throw new ValidationError(
        nextStep
          ? `Orders progress one step at a time — expected "${nextStep}"`
          : 'This order is already delivered',
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: status as OrderStatus },
    });

    await prisma.notification.create({
      data: {
        receiverId: order.userId,
        title: 'Order update',
        message: `Your order is now "${status}"`,
        redirectLink: `/order/${order.id}`,
      },
    });

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});
