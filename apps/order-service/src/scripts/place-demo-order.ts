import 'dotenv/config';
import { prisma } from '@biashara-mall/prisma';
import { saveSession, type SessionCartItem } from '../lib/session';
import { createOrdersFromSession } from '../lib/create-orders-from-session';

// Drives the real post-payment path (order rows, stock, analytics,
// notifications, `logs` event) without a card or a checkout session.
async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'user' } });
  if (!user) throw new Error('No user in the database to place an order for');

  const products = await prisma.product.findMany({
    where: { isDeleted: false, stock: { gt: 0 } },
    take: 2,
  });
  if (products.length === 0) throw new Error('No in-stock products to order');

  const cart: SessionCartItem[] = products.map((product) => ({
    productId: product.id,
    title: product.title,
    quantity: 1,
    salePrice: product.salePrice,
    shopId: product.shopId,
    selectedOptions: null,
  }));

  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const sessionId = `demo_${Date.now()}`;

  await saveSession({
    sessionId,
    userId: user.id,
    cart,
    shopIds: [...new Set(cart.map((item) => item.shopId))],
    shippingAddress: {
      label: 'Home',
      name: user.name ?? 'Demo Buyer',
      street: '1 Biashara Street',
      city: 'Nairobi',
      zip: '00100',
      country: 'Kenya',
    },
    subtotal,
    total: subtotal,
    couponCode: null,
    discount: null,
    createdAt: Date.now(),
  });

  const orders = await createOrdersFromSession(sessionId, `pi_demo_${sessionId}`);

  console.log(`Placed ${orders.length} order(s) for ${user.email}:`);
  for (const order of orders) {
    console.log(`  ${order.id}  shop ${order.shopId}  total ${order.total}`);
  }
  // sendLog is fire-and-forget; exiting immediately kills the producer
  // mid-connect and the event never reaches the topic.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log('Watch /dashboard/loggers for the order-service events.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
