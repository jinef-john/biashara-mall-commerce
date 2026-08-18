import { Router, type Request, type Response } from 'express';
import { prisma, type Prisma } from '@biashara-mall/prisma';
import { IS_EVENT, IS_PRODUCT } from '@biashara-mall/config';

export const productsRouter: Router = Router();

function paginate(query: Request['query']) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function listing(req: Request, res: Response, kind: 'products' | 'events') {
  const { page, limit, skip } = paginate(req.query);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where: Prisma.ProductWhereInput = {
    ...(kind === 'events' ? IS_EVENT : IS_PRODUCT),
    ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        shop: { select: { id: true, name: true } },
        images: { select: { id: true, fileUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
}

productsRouter.get('/get-all-products', (req, res) => listing(req, res, 'products'));
productsRouter.get('/get-all-events', (req, res) => listing(req, res, 'events'));
