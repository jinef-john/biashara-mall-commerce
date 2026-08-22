import { Router, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { ensureUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import { sendLog } from '@biashara-mall/kafka';
import { imagekit } from '../lib/imagekit';

export const shopsRouter: Router = Router();

function requireShopOwner(req: Request, res: Response) {
  const { userId, orgId, orgRole } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return null;
  }
  if (!orgId) {
    res.status(400).json({ message: 'No active organization on this session' });
    return null;
  }
  if (orgRole !== 'org:admin') {
    res.status(403).json({ message: 'Only the shop owner can do this' });
    return null;
  }
  return { userId, orgId };
}

// Returns {fileId, fileUrl}; PATCH /api/shops is what persists the URL.
shopsRouter.post('/branding-image', async (req: Request, res: Response) => {
  if (!requireShopOwner(req, res)) return;

  const { file, fileName } = req.body;
  if (!file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  try {
    const uploaded = await imagekit.upload({
      file,
      fileName: fileName || `shop-${Date.now()}.jpg`,
      folder: '/shops',
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

shopsRouter.delete(
  '/branding-image/:fileId',
  async (req: Request, res: Response) => {
    if (!requireShopOwner(req, res)) return;

    try {
      await imagekit.deleteFile(String(req.params.fileId));
      return res.json({ success: true });
    } catch (err) {
      console.error('ImageKit delete failed', err);
      return res.status(502).json({ message: 'Could not delete image' });
    }
  },
);

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

  // A suspended buyer must not be able to open a shop by going straight to
  // seller-ui; hiding the button in user-ui is not the control.
  const owner = await ensureUser(userId);
  if (owner.status === 'banned') {
    return res
      .status(403)
      .json({ code: 'ACCOUNT_SUSPENDED', message: 'This account is suspended' });
  }

  const { name, bio, address, country, openingHours, website, category } =
    req.body;

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
      country,
      openingHours,
      website,
      category,
    },
    update: { name, bio, address, country, openingHours, website, category },
  });

  void sendLog({
    type: 'success',
    message: `Shop "${shop.name}" saved by owner ${userId}`,
    source: 'seller-service',
  });

  return res.status(201).json({ shop });
});

shopsRouter.patch('/', async (req: Request, res: Response) => {
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
      .json({ message: 'Only the shop owner can update shop details' });
  }

  const existing = await prisma.shops.findUnique({
    where: { clerkOrgId: orgId },
  });
  if (!existing) {
    return res
      .status(404)
      .json({ message: 'Shop not found. Finish onboarding first.' });
  }

  const allowed = [
    'bio',
    'address',
    'country',
    'openingHours',
    'website',
    'category',
    'logoUrl',
    'coverUrl',
    'socialLinks',
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) data[key] = req.body[key];
  }

  const shop = await prisma.shops.update({
    where: { id: existing.id },
    data,
  });

  return res.json({ shop });
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

  return res.json({ shop });
});
