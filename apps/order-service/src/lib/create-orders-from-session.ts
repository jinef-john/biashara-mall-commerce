import { prisma } from '@biashara-mall/prisma';
import { produce, sendLog, TOPICS } from '@biashara-mall/kafka';
import { platformFee, sellerEarning, CURRENCY } from '@biashara-mall/config';
import { getPaymentProvider } from '@biashara-mall/payments';
import { deleteSession, getSession } from './session';
import { splitCartByShop } from './pricing';

/**
 * Shared by both order-creation paths: the real Stripe webhook and the mock
 * provider's confirm-payment route. Idempotent: a missing session (already
 * processed, or expired) is a silent no-op rather than an error, since
 * Stripe retries webhook deliveries.
 */
export async function createOrdersFromSession(
  sessionId: string,
  paymentIntentId: string,
) {
  const session = await getSession(sessionId);
  if (!session) return [];

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return [];

  const splits = splitCartByShop(session.cart, session.discount);

  const shops = await prisma.shops.findMany({
    where: { id: { in: splits.map((s) => s.shopId) } },
  });
  const shopById = new Map(shops.map((s) => [s.id, s]));
  const isMultiShop = splits.length > 1;
  const provider = getPaymentProvider();

  const createdOrders = [];

  for (const { shopId, items, discountAmount, total: shopTotal } of splits) {
    const shop = shopById.get(shopId);
    if (!shop) continue;

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
          console.error(
            `[order ${order.id}] transfer to ${shopId} failed:`,
            err,
          );
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
    void sendLog({
      type: 'success',
      message: `Order ${order.id} placed for ${CURRENCY} ${shopTotal.toFixed(2)} (shop ${shopId})`,
      source: 'order-service',
    });

    // The strongest recommendation signal there is, and nothing else emits it:
    // browsing events come from the client, a completed purchase only exists here.
    void produce(
      TOPICS.USERS_EVENTS.topic,
      items.map((item) => ({
        key: user.clerkId,
        value: JSON.stringify({
          clerkId: user.clerkId,
          action: 'purchase',
          productId: item.productId,
          shopId,
          timestamp: new Date().toISOString(),
        }),
      })),
    ).catch((err) =>
      console.error(
        `[order ${order.id}] purchase event failed:`,
        (err as Error).message,
      ),
    );
  }

  // Order-confirmation email intentionally skipped: no email infrastructure
  // exists anywhere in this codebase. Adding it just for this one email
  // would be a new dependency, not "wire up the existing logic."

  await deleteSession(sessionId);
  return createdOrders;
}
