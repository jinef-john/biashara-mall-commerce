import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';

/** Public — the storefront chrome (logo, banner, nav categories) reads this. */
export const siteConfigRouter: Router = Router();

siteConfigRouter.get('/', async (req: Request, res: Response) => {
  const config = await prisma.siteConfig.findFirst();

  if (!config) {
    return res.status(404).json({ message: 'Site config not found' });
  }

  return res.json({ config });
});
