import express, { Router, type Request, type Response } from 'express';
import { getPaymentProvider } from '@biashara-mall/payments';
import { createOrdersFromSession } from '../lib/create-orders-from-session';

export const webhookRouter: Router = Router();

/**
 * Mounted directly on order-service's own port (6004), never through the
 * gateway. The gateway's rate limiting and CORS would reject Stripe's
 * server-to-server calls. `express.raw()` is applied only to this one route
 * (not the whole router). Scoping it any wider would consume the body
 * stream before express.json() ever sees it, breaking every other route.
 */
webhookRouter.post(
  '/create-order',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string | undefined;
    const event = getPaymentProvider().verifyWebhook(req.body, signature);

    if (!event) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { sessionId } = event.metadata;
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId in metadata' });
    }

    await createOrdersFromSession(sessionId, event.intentId);

    return res.status(200).json({ received: true });
  },
);
