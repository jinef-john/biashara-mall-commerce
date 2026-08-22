import { Router, type Request, type Response } from 'express';
import { clerkClient } from '@clerk/express';
import { prisma, type Prisma, type UserRole } from '@biashara-mall/prisma';
import { sendLog } from '@biashara-mall/kafka';
import { ForbiddenError, NotFoundError, ValidationError } from '@biashara-mall/error-handler';

export const usersRouter: Router = Router();

function paginate(query: Request['query']) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function listUsers(req: Request, res: Response, opts?: { role?: UserRole }) {
  const { page, limit, skip } = paginate(req.query);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const roleParam = opts?.role ?? (req.query.role === 'admin' || req.query.role === 'user' ? req.query.role : undefined);

  const where: Prisma.UserWhereInput = {
    ...(roleParam ? { role: roleParam } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: { total, page, totalPages: Math.ceil(total / limit) || 1 },
  });
}

usersRouter.get('/get-all-users', (req, res) => listUsers(req, res));
usersRouter.get('/get-all-admins', (req, res) => listUsers(req, res, { role: 'admin' }));

usersRouter.put('/add-new-admin', async (req: Request, res: Response, next) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) throw new ValidationError('userId is required');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
    });

    // Mirrored into Clerk so admin-ui's middleware can read the role from the
    // session claim, same as the first-admin bootstrap in packages/auth/ensure-user.ts.
    await clerkClient.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role: 'admin' },
    });

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

usersRouter.put('/update-user-status/:id', async (req: Request, res: Response, next) => {
  try {
    const { banned } = req.body as { banned?: boolean };
    if (typeof banned !== 'boolean') throw new ValidationError('banned must be a boolean');

    const targetId = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundError('User not found');
    if (user.role === 'admin') throw new ForbiddenError('Cannot ban a platform admin');
    if (user.id === req.appUser!.id) throw new ForbiddenError('Cannot ban your own account');

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status: banned ? 'banned' : 'active' },
    });

    void sendLog({
      type: 'warning',
      message: `User ${user.email} ${banned ? 'suspended' : 'reinstated'}`,
      source: 'admin-service',
    });

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});
