import { beforeEach, describe, expect, mock, test } from 'bun:test';

const db = {
  order: { findUnique: mock(async () => null as unknown) },
  productReview: {
    upsert: mock(async () => ({})),
    findMany: mock(async () => [] as unknown[]),
  },
  shopReview: {
    upsert: mock(async () => ({})),
    findUnique: mock(async () => null),
  },
  product: { update: mock(async () => ({})) },
};

mock.module('@biashara-mall/prisma', () => ({ prisma: db }));
mock.module('@biashara-mall/auth', () => ({
  requireActiveUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const { reviewsRouter } =
  await import('../apps/order-service/src/routes/reviews');
const { withRouter, json } = await import('./helpers/router-app');

const BUYER = { id: 'buyer-1' };
const order = (over: Record<string, unknown> = {}) => ({
  id: 'order-1',
  userId: BUYER.id,
  shopId: 'shop-1',
  status: 'delivered',
  items: [{ productId: 'prod-1', title: 'Thing' }],
  ...over,
});

const postProduct = (body: Record<string, unknown>) =>
  withRouter(reviewsRouter, BUYER, (request) =>
    request('/api/reviews/product', { method: 'POST', ...json(body) }),
  );

const valid = {
  orderId: 'order-1',
  productId: 'prod-1',
  rating: 5,
  review: 'Good',
};

beforeEach(() => {
  db.order.findUnique = mock(async () => order() as unknown);
  db.productReview.upsert = mock(async () => ({ id: 'r1' }));
  db.productReview.findMany = mock(async () => [{ rating: 4 }, { rating: 5 }]);
  db.product.update = mock(async () => ({}));
  db.shopReview.upsert = mock(async () => ({ id: 's1' }));
});

describe('a review has to be earned', () => {
  test('a delivered order can review', async () => {
    expect((await postProduct(valid)).status).toBe(200);
    expect(db.productReview.upsert).toHaveBeenCalled();
  });

  test.each(['ordered', 'packed', 'shipped', 'out_for_delivery'])(
    'an order still at %s cannot',
    async (status) => {
      db.order.findUnique = mock(async () => order({ status }) as unknown);
      expect((await postProduct(valid)).status).toBe(400);
      expect(db.productReview.upsert).not.toHaveBeenCalled();
    },
  );

  test("someone else's delivered order cannot", async () => {
    db.order.findUnique = mock(
      async () => order({ userId: 'someone-else' }) as unknown,
    );
    expect((await postProduct(valid)).status).toBe(400);
    expect(db.productReview.upsert).not.toHaveBeenCalled();
  });

  test('an order that does not exist cannot', async () => {
    db.order.findUnique = mock(async () => null);
    expect((await postProduct(valid)).status).toBe(400);
  });

  // The order is the proof of purchase, so a valid order id must not become a
  // licence to review the whole catalogue.
  test('a product missing from the order cannot be reviewed through it', async () => {
    const res = await postProduct({ ...valid, productId: 'never-bought' });
    expect(res.status).toBe(400);
    expect(db.productReview.upsert).not.toHaveBeenCalled();
  });
});

describe('rating validation happens before any write', () => {
  test.each([0, 6, -1, 3.3, 'five'])('rejects %p', async (rating) => {
    expect((await postProduct({ ...valid, rating })).status).toBe(400);
    expect(db.productReview.upsert).not.toHaveBeenCalled();
  });

  test('a rating with no text is fine', async () => {
    const res = await postProduct({
      orderId: 'order-1',
      productId: 'prod-1',
      rating: 4,
    });
    expect(res.status).toBe(200);
  });
});

describe('the stored rating follows the reviews', () => {
  test('the product average is recomputed from every review, not just this one', async () => {
    await postProduct(valid);
    const [args] = db.product.update.mock.calls[0] as [
      { data: { ratings: number } },
    ];
    expect(args.data.ratings).toBe(4.5);
  });

  test('reviewing again updates rather than duplicates', async () => {
    await postProduct(valid);
    const [args] = db.productReview.upsert.mock.calls[0] as [{ where: object }];
    expect(args.where).toEqual({
      userId_productId: { userId: BUYER.id, productId: 'prod-1' },
    });
  });
});

describe('shop reviews use the same gate', () => {
  const postShop = (body: Record<string, unknown>) =>
    withRouter(reviewsRouter, BUYER, (request) =>
      request('/api/reviews/shop', { method: 'POST', ...json(body) }),
    );

  test('a delivered order can rate the seller', async () => {
    expect((await postShop({ orderId: 'order-1', rating: 4 })).status).toBe(
      200,
    );
  });

  test('an undelivered order cannot', async () => {
    db.order.findUnique = mock(
      async () => order({ status: 'shipped' }) as unknown,
    );
    expect((await postShop({ orderId: 'order-1', rating: 4 })).status).toBe(
      400,
    );
    expect(db.shopReview.upsert).not.toHaveBeenCalled();
  });

  test('the shop comes from the order, not the request body', async () => {
    await postShop({ orderId: 'order-1', rating: 4, shopId: 'attacker-shop' });
    const [args] = db.shopReview.upsert.mock.calls[0] as [
      { create: { shopId: string } },
    ];
    expect(args.create.shopId).toBe('shop-1');
  });
});
