import { Router, type Request, type Response } from 'express';
import { requireUser } from '@biashara-mall/auth';

export const meRouter: Router = Router();

meRouter.get('/', requireUser, async (req: Request, res: Response) => {
  const { id, name, email, avatarUrl, role, status } = req.appUser!;
  return res.json({ user: { id, name, email, avatarUrl, role, status } });
});
