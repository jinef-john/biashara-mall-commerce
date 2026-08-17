import { Router, type Request, type Response } from 'express';
import { requireUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';

export const addressesRouter: Router = Router();

addressesRouter.get('/', requireUser, async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.appUser!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return res.json({ addresses });
});

addressesRouter.post('/', requireUser, async (req: Request, res: Response) => {
  const { label, name, street, city, zip, country, isDefault } = req.body;

  const missing = [
    ['label', label],
    ['name', name],
    ['street', street],
    ['city', city],
    ['zip', zip],
    ['country', country],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  const userId = req.appUser!.id;
  const existingCount = await prisma.address.count({ where: { userId } });
  // The first address is always the default; a later one only becomes
  // default if explicitly requested.
  const makeDefault = existingCount === 0 || Boolean(isDefault);

  if (makeDefault && existingCount > 0) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: { label, name, street, city, zip, country, isDefault: makeDefault, userId },
  });

  return res.status(201).json({ address });
});

addressesRouter.delete(
  '/:id',
  requireUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const address = await prisma.address.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!address || address.userId !== userId) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id: address.id } });

    // Keep exactly one default — promote the most recent remaining address.
    if (address.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return res.json({ success: true });
  },
);
