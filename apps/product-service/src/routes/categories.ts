import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';

export const categoriesRouter: Router = Router();

categoriesRouter.get('/', async (req: Request, res: Response) => {
  const config = await prisma.siteConfig.findFirst();

  if (!config) {
    return res.status(404).json({ message: 'Site config not found' });
  }

  return res.json({
    categories: config.categories,
    subcategories: config.subcategories,
  });
});
