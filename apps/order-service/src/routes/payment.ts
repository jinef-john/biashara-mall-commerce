import { Router, type Request, type Response } from 'express';
import { requireUser } from '@biashara-mall/auth';
import { prisma } from '@biashara-mall/prisma';
import { CURRENCY, PLATFORM_FEE_BPS } from '@biashara-mall/config';
import { getPaymentProvider } from '@biashara-mall/payments';
import {
  fingerprintCart,
  findReusableSession,
  getSession,
  saveSession,
  type PaymentSessionData,
  type SessionCartItem,
} from '../lib/session';
import { createOrdersFromSession } from '../lib/create-orders-from-session';

export const paymentRouter: Router = Router();

interface CartInput {
  id: string;
  quantity: number;
  color?: string;
  size?: string;
}

/** Re-derives cart line items from the database — a client-supplied price is
 * never trusted for anything that ends up in a PaymentIntent amount. */
async function normalizeCart(cart: CartInput[]): Promise<
  { error: string } | { items: SessionCartItem[] }
> {
  const items: SessionCartItem[] = [];

  for (const line of cart) {
    const product = await prisma.product.findUnique({ where: { id: line.id } });
    if (!product || product.isDeleted || product.status !== 'active') {
      return { error: `A product in your cart is no longer available` };
    }
    if (line.quantity < 1 || line.quantity > product.stock) {
      return { error: `Not enough stock for "${product.title}"` };
    }
    items.push({
      productId: product.id,
      title: product.title,
      quantity: line.quantity,
      salePrice: product.salePrice,
      shopId: product.shopId,
      selectedOptions: line.color || line.size ? { color: line.color, size: line.size } : null,
    });
  }

  return { items };
}

paymentRouter.post(
  '/create-payment-session',
  requireUser,
  async (req: Request, res: Response) => {
    const userId = req.appUser!.id;
    const { cart } = req.body as { cart: CartInput[] };

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const address = await prisma.address.findFirst({
      where: { userId, isDefault: true },
    });
    if (!address) {
      return res
        .status(400)
        .json({ message: 'Add a shipping address before checking out' });
    }

    const normalized = await normalizeCart(cart);
    if ('error' in normalized) {
      return res.status(400).json({ message: normalized.error });
    }

    const fingerprint = fingerprintCart(normalized.items);
    const reusable = await findReusableSession(userId, fingerprint);
    if (reusable) {
      return res.json({ sessionId: reusable.sessionId });
    }

    const subtotal = normalized.items.reduce(
      (sum, i) => sum + i.salePrice * i.quantity,
      0,
    );
    const sessionId = crypto.randomUUID();
    const session: PaymentSessionData = {
      sessionId,
      userId,
      cart: normalized.items,
      shopIds: [...new Set(normalized.items.map((i) => i.shopId))],
      shippingAddress: {
        label: address.label,
        name: address.name,
        street: address.street,
        city: address.city,
        zip: address.zip,
        country: address.country,
      },
      subtotal,
      total: subtotal,
      couponCode: null,
      discount: null,
      createdAt: Date.now(),
    };
    await saveSession(session);

    return res.status(201).json({ sessionId });
  },
);

paymentRouter.get(
  '/verifying-payment-session',
  requireUser,
  async (req: Request, res: Response) => {
    const sessionId = String(req.query.sessionId ?? '');
    const session = await getSession(sessionId);

    if (!session || session.userId !== req.appUser!.id) {
      return res.status(404).json({ message: 'Checkout session not found or expired' });
    }

    return res.json({
      session,
      provider: getPaymentProvider().name,
      currency: CURRENCY,
    });
  },
);

paymentRouter.post(
  '/create-payment-intent',
  requireUser,
  async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const session = await getSession(String(sessionId ?? ''));

    if (!session || session.userId !== req.appUser!.id) {
      return res.status(404).json({ message: 'Checkout session not found or expired' });
    }

    const shops = await prisma.shops.findMany({
      where: { id: { in: session.shopIds } },
    });
    const destinationAccountId =
      shops.length === 1 ? shops[0].stripeAccountId : null;

    const provider = getPaymentProvider();
    const { intentId, clientSecret } = await provider.createCheckoutIntent({
      amount: session.total,
      currency: CURRENCY.toLowerCase(),
      platformFeeBps: PLATFORM_FEE_BPS,
      destinationAccountId,
      metadata: { sessionId: session.sessionId, userId: session.userId },
    });

    return res.json({ intentId, clientSecret, provider: provider.name });
  },
);

/** Mock-mode only — stands in for the Stripe webhook, which never fires
 * without a real Stripe account. Gated on the active provider so it can
 * never be used to fabricate a paid order once real Stripe is configured. */
paymentRouter.post(
  '/confirm-mock-payment',
  requireUser,
  async (req: Request, res: Response) => {
    const provider = getPaymentProvider();
    if (provider.name !== 'mock') {
      return res.status(403).json({ message: 'Not available with a live payment provider' });
    }

    const { sessionId } = req.body;
    const session = await getSession(String(sessionId ?? ''));

    if (!session || session.userId !== req.appUser!.id) {
      return res.status(404).json({ message: 'Checkout session not found or expired' });
    }

    const orders = await createOrdersFromSession(session.sessionId, `pi_mock_${session.sessionId}`);

    return res.json({ orderIds: orders.map((o) => o.id) });
  },
);

paymentRouter.put(
  '/verify-coupon',
  requireUser,
  async (req: Request, res: Response) => {
    const { sessionId, code } = req.body;
    const session = await getSession(String(sessionId ?? ''));

    if (!session || session.userId !== req.appUser!.id) {
      return res.status(404).json({ message: 'Checkout session not found or expired' });
    }
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Enter a code' });
    }

    const discountCode = await prisma.discountCodes.findUnique({
      where: { discountCode: String(code).toUpperCase() },
    });
    if (!discountCode) {
      return res.status(404).json({ valid: false, message: 'Invalid code' });
    }

    const matchingProduct = await prisma.product.findFirst({
      where: {
        id: { in: session.cart.map((i) => i.productId) },
        shopId: discountCode.shopId,
        discountCodes: { has: discountCode.id },
      },
    });
    if (!matchingProduct) {
      return res
        .status(400)
        .json({ valid: false, message: 'This code does not apply to anything in your cart' });
    }

    const cartItem = session.cart.find((i) => i.productId === matchingProduct.id)!;
    const itemTotal = cartItem.salePrice * cartItem.quantity;
    const rawDiscount =
      discountCode.discountType === 'percentage'
        ? itemTotal * (discountCode.discountValue / 100)
        : discountCode.discountValue;
    const discountAmount = Math.round(Math.min(rawDiscount, itemTotal) * 100) / 100;

    session.couponCode = discountCode.discountCode;
    session.discount = {
      discountAmount,
      discountedProductId: matchingProduct.id,
      discountType: discountCode.discountType,
    };
    session.total = Math.round((session.subtotal - discountAmount) * 100) / 100;
    await saveSession(session);

    return res.json({
      valid: true,
      discountAmount,
      discountedProductId: matchingProduct.id,
      discountType: discountCode.discountType,
      newTotal: session.total,
    });
  },
);

paymentRouter.delete(
  '/verify-coupon',
  requireUser,
  async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const session = await getSession(String(sessionId ?? ''));

    if (!session || session.userId !== req.appUser!.id) {
      return res.status(404).json({ message: 'Checkout session not found or expired' });
    }

    session.couponCode = null;
    session.discount = null;
    session.total = session.subtotal;
    await saveSession(session);

    return res.json({ total: session.total });
  },
);

