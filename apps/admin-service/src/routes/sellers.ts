import { Router, type Request, type Response } from 'express';
import { prisma, type Prisma } from '@biashara-mall/prisma';

export const sellersRouter: Router = Router();

function paginate(query: Request['query']) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

sellersRouter.get('/get-all-sellers', async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where: Prisma.ShopsWhereInput = q
    ? { name: { contains: q, mode: 'insensitive' } }
    : {};

  const [shops, total] = await Promise.all([
    prisma.shops.findMany({
      where,
      select: {
        id: true,
        name: true,
        ownerId: true,
        category: true,
        country: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shops.count({ where }),
  ]);

  res.json({
    shops,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
});
