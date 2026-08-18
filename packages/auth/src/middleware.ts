import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma, type Shops, type User } from '@biashara-mall/prisma';
import { ensureUser } from './ensure-user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      shop?: Shops;
      appUser?: User;
    }
  }
}

/** Signed-in end user. Attaches req.appUser, creating the row if needed. */
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const user = await ensureUser(userId);
    if (user.deletedAt) {
      res.status(403).json({ message: 'Account has been deleted' });
      return;
    }
    req.appUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Seller acting on their own shop. Attaches req.shop. */
export async function requireShop(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId, orgId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  if (!orgId) {
    res.status(400).json({ message: 'No active organization on this session' });
    return;
  }

  try {
    const shop = await prisma.shops.findUnique({ where: { clerkOrgId: orgId } });
    if (!shop) {
      res.status(404).json({ message: 'Shop not found — finish onboarding first' });
      return;
    }
    if (shop.status === 'banned') {
      res.status(403).json({ message: 'This shop has been suspended' });
      return;
    }
    req.shop = shop;
    next();
  } catch (err) {
    next(err);
  }
}

/** Platform admin, per the User.role column (not a Clerk org role). */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const user = await ensureUser(userId);
    if (user.role !== 'admin' || user.deletedAt) {
      res.status(403).json({ message: 'Access denied: admin only' });
      return;
    }
    req.appUser = user;
    next();
  } catch (err) {
    next(err);
  }
}
