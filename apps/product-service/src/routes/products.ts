import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';
import { PRODUCT_PURGE_DELAY_MS } from '@biashara-mall/config';
import { requireShop } from '../middleware/require-shop';
import { imagekit } from '../lib/imagekit';
import { IS_EVENT, IS_PRODUCT } from '../lib/product-kind';

export const productsRouter: Router = Router();

/** "Nike Air Max 90" -> "nike-air-max-90" */
function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slugs are globally unique, so append -2, -3, … until one is free. */
async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || 'product';
  let slug = base;
  let suffix = 1;

  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

interface ParsedBody {
  error?: string;
  data?: {
    numbers: { sale: number; regular: number; stockCount: number };
    dates: { startingDate: Date | null; endingDate: Date | null };
    discountCodes: string[];
  };
}

/** Validation shared by create and update. */
async function parseBody(req: Request, shopId: string): Promise<ParsedBody> {
  const {
    title,
    category,
    subcategory,
    shortDescription,
    detailedDescription,
    stock,
    salePrice,
    regularPrice,
    startingDate,
    endingDate,
    discountCodes = [],
  } = req.body;

  const missing = [
    ['title', title],
    ['category', category],
    ['subcategory', subcategory],
    ['shortDescription', shortDescription],
    ['detailedDescription', detailedDescription],
    ['stock', stock],
    ['salePrice', salePrice],
    ['regularPrice', regularPrice],
  ]
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([name]) => name);

  if (missing.length) {
    return { error: `Missing required fields: ${missing.join(', ')}` };
  }

  const sale = Number(salePrice);
  const regular = Number(regularPrice);
  const stockCount = Number(stock);

  if (
    !Number.isFinite(sale) ||
    !Number.isFinite(regular) ||
    !Number.isFinite(stockCount)
  ) {
    return { error: 'Stock and prices must be numbers' };
  }
  if (sale < 0 || regular < 0 || stockCount < 0) {
    return { error: 'Stock and prices cannot be negative' };
  }
  if (!Number.isInteger(stockCount)) {
    return { error: 'Stock must be a whole number' };
  }
  if (sale > regular) {
    return { error: 'Sale price cannot be higher than the regular price' };
  }

  // Events are products with a date window: both dates or neither.
  let start: Date | null = null;
  let end: Date | null = null;
  if (startingDate || endingDate) {
    if (!startingDate || !endingDate) {
      return { error: 'An event needs both a start and an end date' };
    }
    start = new Date(startingDate);
    end = new Date(endingDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: 'Event dates are not valid dates' };
    }
    if (end <= start) {
      return { error: 'The event must end after it starts' };
    }
  }

  if (!Array.isArray(discountCodes)) {
    return { error: 'discountCodes must be an array' };
  }
  if (discountCodes.length) {
    const owned = await prisma.discountCodes.count({
      where: { id: { in: discountCodes }, shopId },
    });
    if (owned !== discountCodes.length) {
      return { error: 'One or more discount codes do not belong to your shop' };
    }
  }

  return {
    data: {
      numbers: { sale, regular, stockCount },
      dates: { startingDate: start, endingDate: end },
      discountCodes,
    },
  };
}

/**
 * Images are uploaded one at a time as the seller picks them, before the
 * product itself exists, so they come back as a {fileId, fileUrl} pair the
 * form holds onto and submits with the rest of the product.
 */
productsRouter.post(
  '/images',
  requireShop,
  async (req: Request, res: Response) => {
    const { file, fileName } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    try {
      const uploaded = await imagekit.upload({
        file,
        fileName: fileName || `product-${Date.now()}.jpg`,
        folder: '/products',
      });

      return res.status(201).json({
        fileId: uploaded.fileId,
        fileUrl: uploaded.url,
      });
    } catch (err) {
      console.error('ImageKit upload failed', err);
      return res.status(502).json({ message: 'Could not upload image' });
    }
  },
);

/**
 * Called when the seller removes an image from the form, so we don't leave
 * orphans in ImageKit for products that were never created.
 */
productsRouter.delete(
  '/images/:fileId',
  requireShop,
  async (req: Request, res: Response) => {
    try {
      await imagekit.deleteFile(String(req.params.fileId));
      return res.json({ success: true });
    } catch (err) {
      console.error('ImageKit delete failed', err);
      return res.status(502).json({ message: 'Could not delete image' });
    }
  },
);

/** ?kind=products (no date window) | events (with one) | omit for everything */
productsRouter.get('/', requireShop, async (req: Request, res: Response) => {
  const shop = req.shop!;
  const includeDeleted = req.query.includeDeleted === 'true';
  const kind = req.query.kind;

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      ...(includeDeleted ? {} : { isDeleted: false }),
      ...(kind === 'events' ? IS_EVENT : {}),
      ...(kind === 'products' ? IS_PRODUCT : {}),
    },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ products });
});

productsRouter.get('/:id', requireShop, async (req: Request, res: Response) => {
  const shop = req.shop!;

  const product = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    include: { images: true },
  });

  if (!product || product.shopId !== shop.id) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json({ product });
});

/** Soft delete: the record stays so the seller can restore it. */
productsRouter.delete(
  '/:id',
  requireShop,
  async (req: Request, res: Response) => {
    const shop = req.shop!;

    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!product || product.shopId !== shop.id) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // deletedAt holds the purge *deadline*, not the delete time. The hourly
    // job removes anything whose deadline has passed.
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + PRODUCT_PURGE_DELAY_MS),
      },
    });

    return res.json({ product: updated });
  },
);

productsRouter.post(
  '/:id/restore',
  requireShop,
  async (req: Request, res: Response) => {
    const shop = req.shop!;

    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!product || product.shopId !== shop.id) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { isDeleted: false, deletedAt: null },
    });

    return res.json({ product: updated });
  },
);

productsRouter.post('/', requireShop, async (req: Request, res: Response) => {
  const shop = req.shop!;

  const parsed = await parseBody(req, shop.id);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }
  const { numbers, dates, discountCodes } = parsed.data!;

  const {
    title,
    category,
    subcategory,
    shortDescription,
    detailedDescription,
    images = [],
    videoUrl,
    tags = [],
    brand,
    colors = [],
    sizes = [],
    warranty,
    customSpecifications,
    customProperties,
    cashOnDelivery,
  } = req.body;

  const product = await prisma.product.create({
    data: {
      title,
      slug: await uniqueSlug(title),
      category,
      subcategory,
      shortDescription,
      detailedDescription,
      videoUrl: videoUrl || null,
      tags,
      brand: brand || null,
      colors,
      sizes,
      stock: numbers.stockCount,
      salePrice: numbers.sale,
      regularPrice: numbers.regular,
      startingDate: dates.startingDate,
      endingDate: dates.endingDate,
      discountCodes,
      warranty: warranty || null,
      customSpecifications: customSpecifications ?? undefined,
      customProperties: customProperties ?? undefined,
      cashOnDelivery: cashOnDelivery ?? 'yes',
      shopId: shop.id,
      images: {
        create: images
          .filter(
            (image: { fileId?: string; fileUrl?: string }) => image?.fileId,
          )
          .map((image: { fileId: string; fileUrl: string }) => ({
            fileId: image.fileId,
            fileUrl: image.fileUrl,
          })),
      },
    },
    include: { images: true },
  });

  return res.status(201).json({ product });
});

productsRouter.put('/:id', requireShop, async (req: Request, res: Response) => {
  const shop = req.shop!;

  const existing = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!existing || existing.shopId !== shop.id) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const parsed = await parseBody(req, shop.id);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }
  const { numbers, dates, discountCodes } = parsed.data!;

  const {
    title,
    category,
    subcategory,
    shortDescription,
    detailedDescription,
    images = [],
    videoUrl,
    tags = [],
    brand,
    colors = [],
    sizes = [],
    warranty,
    customSpecifications,
    customProperties,
    cashOnDelivery,
  } = req.body;

  // The form submits the full image set, so replace rather than diff.
  await prisma.images.deleteMany({ where: { productId: existing.id } });

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      title,
      slug:
        title === existing.title
          ? existing.slug
          : await uniqueSlug(title, existing.id),
      category,
      subcategory,
      shortDescription,
      detailedDescription,
      videoUrl: videoUrl || null,
      tags,
      brand: brand || null,
      colors,
      sizes,
      stock: numbers.stockCount,
      salePrice: numbers.sale,
      regularPrice: numbers.regular,
      startingDate: dates.startingDate,
      endingDate: dates.endingDate,
      discountCodes,
      warranty: warranty || null,
      customSpecifications: customSpecifications ?? undefined,
      customProperties: customProperties ?? undefined,
      cashOnDelivery: cashOnDelivery ?? 'yes',
      images: {
        create: images
          .filter(
            (image: { fileId?: string; fileUrl?: string }) => image?.fileId,
          )
          .map((image: { fileId: string; fileUrl: string }) => ({
            fileId: image.fileId,
            fileUrl: image.fileUrl,
          })),
      },
    },
    include: { images: true },
  });

  return res.json({ product });
});
