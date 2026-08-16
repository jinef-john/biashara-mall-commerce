import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma, type Shops } from '@biashara-mall/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      shop?: Shops;
    }
  }
}

export async function requireShop(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId, orgId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!orgId) {
    return res
      .status(400)
      .json({ message: 'No active organization on this session' });
  }

  const shop = await prisma.shops.findUnique({ where: { clerkOrgId: orgId } });

  if (!shop) {
    return res
      .status(404)
      .json({ message: 'Shop not found — finish onboarding first' });
  }

  req.shop = shop;
  next();
}
