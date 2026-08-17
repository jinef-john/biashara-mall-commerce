import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';
import { requireShop } from '../middleware/require-shop';
import { imagekit } from '../lib/imagekit';

export const productsRouter = Router();

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

      res.status(201).json({
        fileId: uploaded.fileId,
        fileUrl: uploaded.url,
      });
    } catch (err) {
      console.error('ImageKit upload failed', err);
      res.status(502).json({ message: 'Could not upload image' });
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
      await imagekit.deleteFile(req.params.fileId);
      res.json({ success: true });
    } catch (err) {
      console.error('ImageKit delete failed', err);
      res.status(502).json({ message: 'Could not delete image' });
    }
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
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([name]) => name);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  const sale = Number(salePrice);
  const regular = Number(regularPrice);
  const stockCount = Number(stock);

  if (Number.isNaN(sale) || Number.isNaN(regular) || Number.isNaN(stockCount)) {
    return res
      .status(400)
      .json({ message: 'Stock and prices must be numbers' });
  }
  if (sale > regular) {
    return res
      .status(400)
      .json({ message: 'Sale price cannot be higher than the regular price' });
  }
  if (stockCount < 0) {
    return res.status(400).json({ message: 'Stock cannot be negative' });
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
          .filter((image: { fileId?: string; fileUrl?: string }) => image?.fileId)
          .map((image: { fileId: string; fileUrl: string }) => ({
            fileId: image.fileId,
            fileUrl: image.fileUrl,
          })),
      },
    },
    include: { images: true },
  });

  res.status(201).json({ product });
});
