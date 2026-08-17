import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';
import { MAX_DISCOUNT_CODES_PER_SHOP } from '@biashara-mall/config';
import { requireShop } from '../middleware/require-shop';

export const discountCodesRouter: Router = Router();

discountCodesRouter.get(
  '/',
  requireShop,
  async (req: Request, res: Response) => {
    const codes = await prisma.discountCodes.findMany({
      where: { shopId: req.shop!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ discountCodes: codes });
  },
);

discountCodesRouter.post(
  '/',
  requireShop,
  async (req: Request, res: Response) => {
    const shop = req.shop!;
    const { publicName, discountType, discountValue, discountCode } = req.body;

    if (!publicName || !discountType || !discountValue || !discountCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (discountType !== 'percentage' && discountType !== 'flat') {
      return res
        .status(400)
        .json({ message: 'discountType must be percentage or flat' });
    }
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      return res
        .status(400)
        .json({ message: 'Discount value must be a positive number' });
    }
    if (discountType === 'percentage' && value > 100) {
      return res
        .status(400)
        .json({ message: 'A percentage discount cannot exceed 100' });
    }

    const count = await prisma.discountCodes.count({
      where: { shopId: shop.id },
    });
    if (count >= MAX_DISCOUNT_CODES_PER_SHOP) {
      return res.status(400).json({
        message: `You can have at most ${MAX_DISCOUNT_CODES_PER_SHOP} discount codes`,
      });
    }

    const duplicate = await prisma.discountCodes.findUnique({
      where: { discountCode },
    });
    if (duplicate) {
      return res
        .status(409)
        .json({ message: 'That code is already taken — pick another' });
    }

    const created = await prisma.discountCodes.create({
      data: {
        publicName,
        discountType,
        discountValue: value,
        discountCode,
        shopId: shop.id,
      },
    });

    return res.status(201).json({ discountCode: created });
  },
);

discountCodesRouter.delete(
  '/:id',
  requireShop,
  async (req: Request, res: Response) => {
    const shop = req.shop!;

    const code = await prisma.discountCodes.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!code) {
      return res.status(404).json({ message: 'Discount code not found' });
    }
    if (code.shopId !== shop.id) {
      return res
        .status(403)
        .json({ message: 'This discount code belongs to another shop' });
    }

    await prisma.discountCodes.delete({ where: { id: code.id } });

    // Detach from any products still referencing it.
    const stale = await prisma.product.findMany({
      where: { shopId: shop.id, discountCodes: { has: code.id } },
      select: { id: true, discountCodes: true },
    });
    for (const product of stale) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          discountCodes: product.discountCodes.filter((c) => c !== code.id),
        },
      });
    }

    return res.json({ success: true });
  },
);
