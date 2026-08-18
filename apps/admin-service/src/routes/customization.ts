import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';

export const customizationRouter: Router = Router();

customizationRouter.get('/get-all-customization', async (req: Request, res: Response) => {
  const siteConfig = await prisma.siteConfig.findFirst();
  res.json({ siteConfig });
});
