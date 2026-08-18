import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from '@biashara-mall/config';
import { imagekit } from '../lib/imagekit';

export const customizationRouter: Router = Router();

customizationRouter.get('/get-all-customization', async (req: Request, res: Response) => {
  const siteConfig = await prisma.siteConfig.findFirst();
  res.json({ siteConfig });
});

customizationRouter.put('/update-customization', async (req: Request, res: Response, next) => {
  try {
    const { categories, subcategories, logoUrl, bannerUrl } = req.body as {
      categories?: string[];
      subcategories?: Record<string, string[]>;
      logoUrl?: string | null;
      bannerUrl?: string | null;
    };

    const data = {
      ...(categories !== undefined && { categories }),
      ...(subcategories !== undefined && { subcategories }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(bannerUrl !== undefined && { bannerUrl }),
    };

    const existing = await prisma.siteConfig.findFirst();
    const siteConfig = existing
      ? await prisma.siteConfig.update({ where: { id: existing.id }, data })
      : await prisma.siteConfig.create({
          data: {
            categories: DEFAULT_CATEGORIES,
            subcategories: DEFAULT_SUBCATEGORIES,
            ...data,
          },
        });

    res.json({ siteConfig });
  } catch (err) {
    next(err);
  }
});

customizationRouter.post('/upload-image', async (req: Request, res: Response) => {
  const { file, fileName } = req.body;

  if (!file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  try {
    const uploaded = await imagekit.upload({
      file,
      fileName: fileName || `site-config-${Date.now()}.jpg`,
      folder: '/site-config',
    });

    return res.status(201).json({
      fileId: uploaded.fileId,
      fileUrl: uploaded.url,
    });
  } catch (err) {
    console.error('ImageKit upload failed', err);
    return res.status(502).json({ message: 'Could not upload image' });
  }
});

customizationRouter.delete('/upload-image/:fileId', async (req: Request, res: Response) => {
  try {
    await imagekit.deleteFile(String(req.params.fileId));
    return res.json({ success: true });
  } catch (err) {
    console.error('ImageKit delete failed', err);
    return res.status(502).json({ message: 'Could not delete image' });
  }
});
