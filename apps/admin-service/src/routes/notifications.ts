import { Router, type Request, type Response } from 'express';
import { prisma } from '@biashara-mall/prisma';

export const notificationsRouter: Router = Router();

notificationsRouter.get('/notifications', async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { receiverId: 'admin' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.json({ notifications });
});

notificationsRouter.post(
  '/mark-notification-as-read',
  async (req: Request, res: Response) => {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ message: 'notificationId is required' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.receiverId !== 'admin') {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'read' },
    });

    return res.json({ notification: updated });
  },
);
