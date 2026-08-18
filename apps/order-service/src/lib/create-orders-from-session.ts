import { prisma } from '@biashara-mall/prisma';
import { platformFee, sellerEarning, CURRENCY } from '@biashara-mall/config';
import { getPaymentProvider } from '@biashara-mall/payments';
import { deleteSession, getSession, type SessionCartItem } from './session';

/**
 * Shared by both order-creation paths: the real Stripe webhook and the mock
 * provider's confirm-payment route. Idempotent: a missing session (already
 * processed, or expired) is a silent no-op rather than an error, since
 * Stripe retries webhook deliveries.
 */
export async function createOrdersFromSession(sessionId: string, paymentIntentId: string) {
  const session = await getSession(sessionId);
  if (!session) return [];

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return [];

  const byShop = new Map<string, SessionCartItem[]>();
  for (const item of session.cart) {
    if (!byShop.has(item.shopId)) byShop.set(item.shopId, []);
    byShop.get(item.shopId)!.push(item);
  }

  const shops = await prisma.shops.findMany({ where: { id: { in: [...byShop.keys()] } } });
  const shopById = new Map(shops.map((s) => [s.id, s]));
  const isMultiShop = byShop.size > 1;
  const provider = getPaymentProvider();

  const createdOrders = [];

  for (const [shopId, items] of byShop) {
    const shop = shopById.get(shopId);
    if (!shop) continue;

    const shopSubtotal = items.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
    const discountAmount =
      session.discount && items.some((i) => i.productId === session.discount!.discountedProductId)
        ? session.discount.discountAmount
        : 0;
    const shopTotal = shopSubtotal - discountAmount;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        shopId,
        items: items.map((i) => ({
          productId: i.productId,
          title: i.title,
          quantity: i.quantity,
          salePrice: i.salePrice,
          selectedOptions: i.selectedOptions ?? undefined,
        })),
        total: shopTotal,
        discountAmount,
        platformFee: platformFee(shopTotal),
        couponCode: discountAmount > 0 ? session.couponCode : null,
        status: 'ordered',
        paymentStatus: 'paid',
        paymentIntentId,
        shippingAddress: session.shippingAddress,
      },
    });
    createdOrders.push(order);

    // A single-shop cart's PaymentIntent already named this shop as the
    // destination, so Stripe settled it automatically. A multi-shop cart's
    // intent had no destination (one PaymentIntent can only name one), so
    // each shop's cut is transferred separately here, after payment.
    if (isMultiShop && shop.stripeAccountId) {
      await provider
        .createTransfer({
          amount: sellerEarning(shopTotal),
          currency: CURRENCY,
          destinationAccountId: shop.stripeAccountId,
          metadata: { orderId: order.id },
        })
        .catch((err) => {
          // The order is already recorded as paid: a failed transfer is a
          // payout problem to reconcile manually, not a reason to lose the order.
          console.error(`[order ${order.id}] transfer to ${shopId} failed:`, err);
        });
    }

    for (const item of items) {
      await prisma.productAnalytics.upsert({
        where: { productId: item.productId },
        create: { productId: item.productId, purchases: item.quantity },
        update: { purchases: { increment: item.quantity } },
      });
      await prisma.product.update({
        where: { id: item.productId },
        data: { totalSales: { increment: item.quantity } },
      });
    }

    await prisma.notification.create({
      data: {
        receiverId: shopId,
        title: 'New order',
        message: `You have a new order for ${CURRENCY} ${shopTotal.toFixed(2)}`,
        redirectLink: `/dashboard/orders/${order.id}`,
      },
    });
    await prisma.notification.create({
      data: {
        receiverId: 'admin',
        title: 'New order placed',
        message: `Order ${order.id} placed by ${user.email}`,
        redirectLink: `/orders/${order.id}`,
      },
    });
  }

  // Order-confirmation email intentionally skipped: no email infrastructure
  // exists anywhere in this codebase (nodemailer + ejs was cut when Clerk
  // replaced the transcript's custom auth); adding it just for this one
  // email would be a new dependency, not "wire up the existing logic."

  await deleteSession(sessionId);
  return createdOrders;
}
