import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';
import { requireShop } from '../middleware/require-shop';
import { imagekit } from '../lib/imagekit';

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
async function uniqueSlug(title: string) {
  const base = slugify(title) || 'product';
  let slug = base;
  let suffix = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

/**
 * Images are uploaded one at a time as the seller picks them, before the
 * product itself exists — so they come back as a {fileId, fileUrl} pair the
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
      res.json({ success: true });
    } catch (err) {
      console.error('ImageKit delete failed', err);
      res.status(502).json({ message: 'Could not delete image' });
    }
  },
);

productsRouter.get('/', requireShop, async (req: Request, res: Response) => {
  const shop = req.shop!;
  const includeDeleted = req.query.includeDeleted === 'true';

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ products });
});

/** Soft delete — the record stays so the seller can restore it. */
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

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { isDeleted: true, deletedAt: new Date() },
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
    stock,
    salePrice,
    regularPrice,
    warranty,
    customSpecifications,
    customProperties,
    cashOnDelivery,
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
    .filter(
      ([, value]) => value === undefined || value === null || value === '',
    )
    .map(([name]) => name);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  const sale = Number(salePrice);
  const regular = Number(regularPrice);
  const stockCount = Number(stock);

  if (
    !Number.isFinite(sale) ||
    !Number.isFinite(regular) ||
    !Number.isFinite(stockCount)
  ) {
    return res
      .status(400)
      .json({ message: 'Stock and prices must be numbers' });
  }
  if (sale < 0 || regular < 0 || stockCount < 0) {
    return res
      .status(400)
      .json({ message: 'Stock and prices cannot be negative' });
  }
  if (!Number.isInteger(stockCount)) {
    return res.status(400).json({ message: 'Stock must be a whole number' });
  }
  if (sale > regular) {
    return res
      .status(400)
      .json({ message: 'Sale price cannot be higher than the regular price' });
  }

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
      stock: stockCount,
      salePrice: sale,
      regularPrice: regular,
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
