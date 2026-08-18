import { prisma, type OrderStatus, type PaymentStatus } from '@biashara-mall/prisma';
import { COUNTRIES } from '@biashara-mall/config';

const ORDER_STATUSES: OrderStatus[] = ['ordered', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
// Weighted so most demo orders read as successful, matching real-world skew.
const PAYMENT_STATUSES: PaymentStatus[] = [
  'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid',
  'pending', 'failed', 'refunded',
];

const ORDER_COUNT = 100;
const DAYS_BACK = 60;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinDays(days: number): Date {
  const now = Date.now();
  const offsetMs = Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs);
}

async function main() {
  const [shops, users, products] = await Promise.all([
    prisma.shops.findMany({ select: { id: true } }),
    prisma.user.findMany({ select: { id: true } }),
    prisma.product.findMany({ select: { id: true, title: true, salePrice: true, shopId: true } }),
  ]);

  if (!shops.length || !users.length || !products.length) {
    throw new Error('Need at least one shop, user, and product to seed orders');
  }

  const productsByShop = new Map<string, typeof products>();
  for (const product of products) {
    const list = productsByShop.get(product.shopId) ?? [];
    list.push(product);
    productsByShop.set(product.shopId, list);
  }
  const shopsWithProducts = shops.filter((s) => productsByShop.get(s.id)?.length);
  if (!shopsWithProducts.length) {
    throw new Error('No shop has any products to attach to orders');
  }

  let created = 0;
  for (let i = 0; i < ORDER_COUNT; i++) {
    const shop = pick(shopsWithProducts);
    const shopProducts = productsByShop.get(shop.id)!;
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const items = Array.from({ length: itemCount }, () => pick(shopProducts)).map((p) => ({
      productId: p.id,
      title: p.title,
      quantity: 1 + Math.floor(Math.random() * 3),
      salePrice: p.salePrice,
    }));
    const total = Math.round(items.reduce((sum, it) => sum + it.salePrice * it.quantity, 0) * 100) / 100;
    const country = pick(COUNTRIES);

    await prisma.order.create({
      data: {
        userId: pick(users).id,
        shopId: shop.id,
        items,
        total,
        platformFee: Math.round(total * 0.05 * 100) / 100,
        status: pick(ORDER_STATUSES),
        paymentStatus: pick(PAYMENT_STATUSES),
        shippingAddress: {
          label: 'Home',
          name: 'Demo Customer',
          street: '123 Demo Street',
          city: `${country} City`,
          zip: '00100',
          country,
        },
        createdAt: randomDateWithinDays(DAYS_BACK),
      },
    });
    created++;
  }

  console.log(`Seeded ${created} demo orders across ${shopsWithProducts.length} shop(s).`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
