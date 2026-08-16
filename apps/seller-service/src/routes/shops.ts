import { Router, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '@biashara-mall/prisma';

export const shopsRouter = Router();

shopsRouter.post('/', async (req: Request, res: Response) => {
  const { userId, orgId, orgRole } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!orgId) {
    return res
      .status(400)
      .json({ message: 'No active organization on this session' });
  }
  if (orgRole !== 'org:admin') {
    return res
      .status(403)
      .json({ message: 'Only the shop owner can set up shop details' });
  }

  const { name, bio, address, openingHours, website, category } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Shop name is required' });
  }

  const shop = await prisma.shops.upsert({
    where: { clerkOrgId: orgId },
    create: {
      clerkOrgId: orgId,
      ownerId: userId,
      name,
      bio,
      address,
      openingHours,
      website,
      category,
    },
    update: { name, bio, address, openingHours, website, category },
  });

  res.status(201).json({ shop });
});

shopsRouter.get('/me', async (req: Request, res: Response) => {
  const { userId, orgId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!orgId) {
    return res.status(404).json({ shop: null });
  }

  const shop = await prisma.shops.findUnique({ where: { clerkOrgId: orgId } });

  res.json({ shop });
});
