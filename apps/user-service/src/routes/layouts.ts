import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';

export const layoutsRouter: Router = Router();

layoutsRouter.get('/', async (req: Request, res: Response) => {
  const config = await prisma.siteConfig.findFirst();

  res.json({
    logoUrl: config?.logoUrl ?? null,
    bannerUrl: config?.bannerUrl ?? null,
  });
});
