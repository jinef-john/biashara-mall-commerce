import { Router, type Request, type Response } from 'express';
import { prisma, type Prisma } from '@biashara-mall/prisma';
import { IS_EVENT, IS_PRODUCT } from '../lib/product-kind';

/** Everything here is unauthenticated — it is what the storefront reads. */
export const publicRouter: Router = Router();

/** A buyer must never see a soft-deleted or draft/pending listing. */
const VISIBLE: Prisma.ProductWhereInput = { isDeleted: false, status: 'active' };

const CARD_INCLUDE = {
  images: { select: { id: true, fileUrl: true } },
  shop: { select: { id: true, name: true, logoUrl: true, category: true } },
} satisfies Prisma.ProductInclude;

/** Accepts `?colors=red&colors=blue` and `?colors=red,blue` alike. */
function list(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  return raw
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

function paginate(query: Request['query']) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

/** `?priceRange=0,5000` — either bound may be blank. */
function priceFilter(value: unknown): Prisma.FloatFilter | undefined {
  const [min, max] = list(value).map(Number);
  const filter: Prisma.FloatFilter = {};
  if (Number.isFinite(min)) filter.gte = min;
  if (Number.isFinite(max)) filter.lte = max;
  return Object.keys(filter).length ? filter : undefined;
}

/**
 * `?type=latest` sorts purely by recency; anything else leads with recency and
 * breaks ties on sales, which is what the home page's default grid wants.
 */
function ordering(type: unknown): Prisma.ProductOrderByWithRelationInput[] {
  return type === 'latest'
    ? [{ createdAt: 'desc' }]
    : [{ createdAt: 'desc' }, { totalSales: 'desc' }];
}

async function listing(req: Request, res: Response, kind: 'products' | 'events') {
  const { page, limit, skip } = paginate(req.query);
  const base: Prisma.ProductWhereInput = {
    ...VISIBLE,
    ...(kind === 'events' ? IS_EVENT : IS_PRODUCT),
  };

  const [products, total, top10] = await Promise.all([
    prisma.product.findMany({
      where: base,
      include: CARD_INCLUDE,
      orderBy: ordering(req.query.type),
      skip,
      take: limit,
    }),
    prisma.product.count({ where: base }),
    prisma.product.findMany({
      where: base,
      include: CARD_INCLUDE,
      orderBy: { totalSales: 'desc' },
      take: 10,
    }),
  ]);

  return res.json({
    products,
    top10,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
}

publicRouter.get('/get-all-products', (req, res) => listing(req, res, 'products'));
publicRouter.get('/get-all-events', (req, res) => listing(req, res, 'events'));

publicRouter.get('/get-product/:slug', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: String(req.params.slug) },
    include: {
      images: { select: { id: true, fileUrl: true } },
      shop: {
        select: {
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
        },
      },
    },
  });

  if (!product || product.isDeleted || product.status !== 'active') {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json({ product });
});

async function filtered(req: Request, res: Response, kind: 'products' | 'events') {
  const { page, limit, skip } = paginate(req.query);
  const categories = list(req.query.categories);
  const colors = list(req.query.colors);
  const sizes = list(req.query.sizes);
  const price = priceFilter(req.query.priceRange);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where: Prisma.ProductWhereInput = {
    ...VISIBLE,
    ...(kind === 'events' ? IS_EVENT : IS_PRODUCT),
    ...(categories.length ? { category: { in: categories } } : {}),
    ...(colors.length ? { colors: { hasSome: colors } } : {}),
    ...(sizes.length ? { sizes: { hasSome: sizes } } : {}),
    ...(price ? { salePrice: price } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { shortDescription: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: CARD_INCLUDE,
      orderBy: ordering(req.query.type),
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return res.json({
    products,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
}

publicRouter.get('/get-filtered-products', (req, res) =>
  filtered(req, res, 'products'),
);
publicRouter.get('/get-filtered-offers', (req, res) =>
  filtered(req, res, 'events'),
);

publicRouter.get('/get-filtered-shops', async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query);
  const categories = list(req.query.categories);
  const countries = list(req.query.countries);

  const where: Prisma.ShopsWhereInput = {
    ...(categories.length ? { category: { in: categories } } : {}),
    ...(countries.length ? { country: { in: countries } } : {}),
  };

  const [shops, total] = await Promise.all([
    prisma.shops.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        logoUrl: true,
        coverUrl: true,
        category: true,
        country: true,
        _count: { select: { followers: true, products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shops.count({ where }),
  ]);

  return res.json({
    shops,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
});

publicRouter.get('/search-products', async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!q) {
    return res.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      ...VISIBLE,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, title: true, slug: true, salePrice: true },
    take: 10,
  });

  return res.json({ products });
});

publicRouter.get('/top-shops', async (req: Request, res: Response) => {
  const bySales = await prisma.order.groupBy({
    by: ['shopId'],
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10,
  });

  const ranked = new Map(
    bySales.map((row) => [row.shopId, row._sum.total ?? 0]),
  );

  // Before the first order lands, rank by catalogue size so the home page's
  // Top Shops rail is never empty.
  const shops = await prisma.shops.findMany({
    where: ranked.size ? { id: { in: [...ranked.keys()] } } : {},
    select: {
      id: true,
      name: true,
      bio: true,
      logoUrl: true,
      coverUrl: true,
      category: true,
      country: true,
      _count: { select: { followers: true, products: true } },
    },
    ...(ranked.size ? {} : { orderBy: { products: { _count: 'desc' } }, take: 10 }),
  });

  return res.json({
    shops: shops
      .map((shop) => ({ ...shop, totalSales: ranked.get(shop.id) ?? 0 }))
      .sort((a, b) => b.totalSales - a.totalSales),
  });
});
